"use server";

import { ApplicationRegistry } from '@/infrastructure/di/ApplicationRegistry';
import { OptimizeQuotationCommand } from '@core/application/handlers/quotations/OptimizeQuotation';
import { withTracing } from '@/lib/otel';

/**
 * Server Action: Triggers the automatic margin optimization for a quotation.
 */
export async function optimizeQuotationAction(quotationId: string) {
    return withTracing("action.optimizeQuotation", async () => {
        try {
            const commandBus = ApplicationRegistry.getCommandBus();
            const command = new OptimizeQuotationCommand(quotationId);
            const result = await commandBus.dispatch<number>(command);

            if (result.isFailure()) {
                return { success: false, error: result.getError().message };
            }

            return { success: true, suggestedMarkup: result.getValue() };
        } catch (error) {
            console.error("[OptimizeQuotationAction] Error:", error);
            return { success: false, error: "Error interno al optimizar la cotización" };
        }
    });
}
