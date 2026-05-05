import { getContainer } from '@/infrastructure/di/Container'
import { logger } from '@infrastructure/telemetry/StructuredLogger'
import { withAuth } from '@/lib/api/with-auth';
import { ApiResponder } from '@/infrastructure/http/ApiResponder';
import { AppError } from '@/core/shared/AppError';

export const POST = withAuth(async (request, _user, params) => {
    try {
        const id = params?.id;
        if (!id) return ApiResponder.fromAppError(AppError.validation('Missing ID'));

        const body = await request.json()
        const container = await getContainer()
        const handler = await container.resolve<any>('QuotationTransitionHandler')
        
        const result = await handler.execute({ 
            id, 
            newStatus: body.newStatus,
            metadata: body.metadata 
        })

        if (result.isErr()) {
            return ApiResponder.fromAppError(AppError.business(result.error.message));
        }

        return ApiResponder.success({ quotation: result.value });
    } catch (error) {
        logger.error('Error transitioning quotation state:', error as Error)
        return ApiResponder.fatal(error);
    }
});
