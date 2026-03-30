import { ReadModelRepository, QuotationSummary } from '@core/application/ports/ReadModelRepository';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { QuotationStatus } from '@core/domain/aggregates/quotation/QuotationStatus';

export class SupabaseQuotationReadModel implements ReadModelRepository {
    private supabase = createServiceRoleClient();

    async getQuotationSummary(id: string): Promise<Result<QuotationSummary | null, AppError>> {
        try {
            const { data, error } = await this.supabase
                .from('quotation_summaries')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return ok(null); // Not found
                logger.error(`Error fetching quotation summary ${id}`, error);
                return fail(AppError.internal(`Read Model Error: ${error.message}`));
            }

            if (!data) return ok(null);
            
            return ok({
                id: data.id,
                clientId: data.client_id,
                clientEmail: data.client_email,
                serviceId: data.service_id,
                serviceName: data.service_name,
                code: data.code,
                status: data.status as QuotationStatus,
                totalAmount: data.total_amount,
                currency: data.currency,
                eventDate: new Date(data.event_date),
                updatedAt: new Date(data.updated_at)
            });
        } catch (error) {
            return fail(AppError.from(error));
        }
    }

    async listRecentSummaries(limit: number = 10): Promise<Result<QuotationSummary[], AppError>> {
        try {
            const { data, error } = await this.supabase
                .from('quotation_summaries')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(limit);

            if (error) {
                logger.error('Error listing recent summaries', error);
                return fail(AppError.internal(`Read Model Error: ${error.message}`));
            }

            const summaries = (data || []).map(d => ({
                id: d.id,
                clientId: d.client_id,
                clientEmail: d.client_email,
                serviceId: d.service_id,
                serviceName: d.service_name,
                code: d.code,
                status: d.status as QuotationStatus,
                totalAmount: d.total_amount,
                currency: d.currency,
                eventDate: new Date(d.event_date),
                updatedAt: new Date(d.updated_at)
            }));

            return ok(summaries);
        } catch (error) {
            return fail(AppError.from(error));
        }
    }

    async getFinancialStats(startDate: Date, endDate: Date): Promise<Result<{
        totalRevenue: number;
        totalQuotations: number;
        averageTicket: number;
    }, AppError>> {
        try {
            const { data, error } = await this.supabase
                .from('quotation_summaries')
                .select('total_amount')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .eq('status', 'PAID'); 

            if (error) {
                logger.error('Error fetching financial stats', error);
                return fail(AppError.internal(`Read Model Error: ${error.message}`));
            }

            const totalRevenue = (data || []).reduce((acc, curr) => acc + curr.total_amount, 0);
            const totalQuotations = (data || []).length;
            const averageTicket = totalQuotations > 0 ? totalRevenue / totalQuotations : 0;

            return ok({ totalRevenue, totalQuotations, averageTicket });
        } catch (error) {
            return fail(AppError.from(error));
        }
    }
}
