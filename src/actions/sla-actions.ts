// src/actions/sla-actions.ts
'use server';

import { container } from '@infrastructure/di/bindings';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { SLAService } from '@core/application/services/SLAService';

/**
 * Checks SLA Risk for a specific order.
 */
export async function checkOrderSLARiskAction(orderId: string) {
    try {
        const slaService = await container.resolve<SLAService>('SLAService');
        const result = await slaService.checkOrderSLARisk(orderId);

        if (result.isFailure()) {
            return { success: false, error: result.getError().message };
        }

        return { success: true, data: result.getValue() };
    } catch (error) {
        logger.error('Error in checkOrderSLARiskAction:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error al analizar riesgo SLA' 
        };
    }
}

/**
 * Batch analysis for dashboard.
 */
export async function auditActiveSLAAction() {
    try {
        const slaService = await container.resolve<SLAService>('SLAService');
        const result = await slaService.auditActiveOrders();

        if (result.isFailure()) {
            return { success: false, error: result.getError().message };
        }

        return { success: true, data: result.getValue() };
    } catch (error) {
        logger.error('Error in auditActiveSLAAction:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error en auditoría masiva de SLA' 
        };
    }
}
