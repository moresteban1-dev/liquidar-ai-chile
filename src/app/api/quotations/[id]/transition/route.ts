import { getContainer } from '@/infrastructure/di/Container'
import { logger } from '@infrastructure/telemetry/StructuredLogger'
import { withAuth } from '@/lib/api/with-auth';
import { ApiResponder } from '@/infrastructure/http/ApiResponder';
import { AppError } from '@/core/shared/AppError';
import { QuotationService } from '@/core/application/services/quotation-service';

export const POST = withAuth(async (request, _user, params) => {
    try {
        const id = params?.id;
        if (!id) return ApiResponder.fromAppError(AppError.validation('Missing ID'));

        const body = await request.json()
        const container = await getContainer()
        const quotationService = await container.resolve<QuotationService>('QuotationService')
        
        const toStatus = body.toStatus || body.newStatus;
        if (!toStatus) {
            return ApiResponder.fromAppError(AppError.validation('Missing toStatus or newStatus'));
        }

        const result = await quotationService.transitionQuotation(id, toStatus as any, {
            assignedProviderId: body.assignedProviderId,
            markupPercentage: body.markupPercentage,
            itemsPricing: body.itemsPricing,
            internalNotes: body.internalNotes || body.metadata?.notes
        })

        if (result.isFailure()) {
            return ApiResponder.fromAppError(result.getError());
        }

        return ApiResponder.success({ quotation: result.getValue() });
    } catch (error) {
        logger.error('Error transitioning quotation state:', error as Error)
        return ApiResponder.fatal(error);
    }
});
