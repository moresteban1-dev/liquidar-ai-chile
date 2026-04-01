'use server';

import { requireRole } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';
import { ActionResponse } from '@/types/actions';
import { revalidatePath } from 'next/cache';
import { triggerN8nWebhook } from '@/lib/n8n';
import { withTracing } from '@/lib/otel';
import { createQuotationId } from '@core/domain/types/branded';

/**
 * Approve and Pay (Client only)
 */
export async function approveQuote(quotationId: string): Promise<ActionResponse> {
    return withTracing('action.client_approve_quote', async (span) => {
        try {
            const authResult = await requireRole(UserRole.CLIENT);
            if (authResult.isFailure()) return { success: false, error: authResult.getError().message };
            const { user } = authResult.getValue();
            span.setAttribute('quotation.id', quotationId);
            span.setAttribute('client.id', user?.id || 'unknown');

            const { ApplicationRegistry } = await import('@infrastructure/di/ApplicationRegistry');
            const { ApproveQuotationCommand } = await import('@core/application/handlers/quotations/ApproveQuotation');

            // Execute via Command Bus
            const result = await ApplicationRegistry.getCommandBus().dispatch<string>(
                new ApproveQuotationCommand(createQuotationId(quotationId))
            );

            if (result.isFailure()) {
                return { success: false, error: result.getError().message };
            }

            const orderId = result.getValue();

            await triggerN8nWebhook('client-approved', {
                quotationId,
                clientId: user.id,
                orderId
            });

            revalidatePath('/client/quotations');
            return { success: true, data: orderId };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: message };
        }
    });
}
