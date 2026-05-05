import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createApiClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';
import { ApiResponder } from '@/infrastructure/http/ApiResponder';
import { AppError } from '@/core/shared/AppError';

export const GET = withAuth(async (_request, user, params) => {
    try {
        const id = params?.id;
        if (!id) return ApiResponder.fromAppError(AppError.validation('Missing ID'));

        const clientResult = await createApiClient();
        if (clientResult.isFailure()) {
            return ApiResponder.fromAppError(AppError.unauthorized(clientResult.getError().message));
        }
        const supabase = clientResult.getValue();

        if (user.role !== UserRole.VENDOR) {
            return ApiResponder.fromAppError(AppError.forbidden('No autorizado. Se requiere rol de VENDOR.'));
        }

        const { data, error } = await supabase
            .from('quotations')
            .select(`
                id, code, brief, requirements, status,
                event_start_date, event_end_date, event_location, event_time, setup_time, teardown_time,
                technical_visit,
                service:services(name, category:categories(name)),
                quotation_items(id, quantity, service:services(name)),
                quotation_requested_items(id, item_name, quantity, sort_order),
                quotation_provider_items(id, category, concept, quantity, unit_price_net, total_price_net, sort_order)
            `)
            .eq('id', id)
            .eq('assigned_provider_id', user.id)
            .single();

        if (error) {
            logger.error('Error fetching quotation for vendor:', error);
            return ApiResponder.fromAppError(AppError.notFound('Cotización'));
        }

        const result = data as any;
        const serviceData = data.service as any;

        const mappedData = {
            id: result.id,
            code: result.code,
            brief: result.brief,
            requirements: result.requirements,
            status: result.status,
            eventStartDate: result.event_start_date,
            eventEndDate: result.event_end_date,
            eventLocation: result.event_location,
            eventTime: result.event_time,
            setupTime: result.setup_time,
            teardownTime: result.teardown_time,
            technicalVisit: result.technical_visit,
            service: serviceData ? { name: serviceData.name } : null,
            category: serviceData?.category?.[0] ?? null,
            quotation_items: result.quotation_items,
            requested_items: result.quotation_requested_items,
            provider_items: result.quotation_provider_items
        };

        return ApiResponder.success(mappedData);

    } catch (error) {
        logger.error('API Error:', error);
        return ApiResponder.fatal(error);
    }
});
