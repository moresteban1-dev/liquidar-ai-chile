import { SupabaseClient } from '@supabase/supabase-js';
import { QuotationHistoryRepository } from '@app/ports/QuotationHistoryRepository';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { QuotationStatus } from '@core/domain/aggregates/quotation/QuotationStatus';
import { UserRole } from '@/core/domain/auth/UserRole';

/**
 * SupabaseQuotationHistoryRepository
 * 
 * Infrastructure implementation for tracking quotation status transitions and audit trails.
 */
export class SupabaseQuotationHistoryRepository implements QuotationHistoryRepository {
    constructor(private readonly supabase: SupabaseClient) {}

    async recordTransition(params: {
        quotationId: string;
        previousStatus: QuotationStatus;
        newStatus: QuotationStatus;
        actorId: string;
        actorType: UserRole | 'SYSTEM';
        comment?: string;
    }): Promise<Result<void, AppError>> {
        const { error } = await this.supabase
            .from('quotation_history')
            .insert({
                quotation_id: params.quotationId,
                previous_status: params.previousStatus,
                new_status: params.newStatus,
                actor_id: params.actorId,
                actor_type: params.actorType,
                comment: params.comment,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error recording quotation transition:', error);
            return fail(AppError.internal(`Failed to record history: ${error.message}`));
        }

        return ok(undefined);
    }
}
