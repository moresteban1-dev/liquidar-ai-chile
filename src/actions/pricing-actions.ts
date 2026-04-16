// src/actions/pricing-actions.ts
'use server';

import { getContainer } from '@infrastructure/di/Container';
import { DI_KEYS } from '@infrastructure/di/DIKeys';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { PricingCalculatorService } from '@core/application/services/PricingCalculatorService';

/**
 * Predicts the optimal price for a catalog item or quotation line.
 */
export async function predictPriceAction(data: {
    serviceId: string;
    historicalCosts: number[];
    historicalPrices: number[];
    complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
}) {
    try {
        const container = await getContainer();
        const pricingService = await container.resolve<PricingCalculatorService>('PricingCalculatorService');
        
        const result = await pricingService.predictOptimalPrice(
            data.serviceId,
            data.historicalCosts,
            data.historicalPrices,
            data.complexity || 'MEDIUM'
        );

        if (result.isFailure()) {
            return { success: false, error: result.getError() };
        }

        return { success: true, data: result.getValue() };
    } catch (error) {
        logger.error('Error in predictPriceAction:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error al predecir precio con IA' 
        };
    }
}
