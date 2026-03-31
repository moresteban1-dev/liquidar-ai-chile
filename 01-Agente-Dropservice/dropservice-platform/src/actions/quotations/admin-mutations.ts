'use server';

import { BiasAnalysisOutput } from '@core/application/ports/AIBrokerPort';
import { createQuotationId } from '@core/domain/types/branded';
import { ActionResponse } from '@/types/actions';
import { revalidatePath } from 'next/cache';
import { triggerN8nWebhook } from '@/lib/n8n';
import { createServiceRoleClient as _createServiceRoleClient, requireRole } from '@/lib/supabase/api';
import { withTracing } from '@/lib/otel';
import { UserRole } from '@/core/domain/auth/UserRole';

/**
 * Assign a provider to a quotation (Admin only)
 */
export async function assignProvider(quotationId: string, providerId: string): Promise<ActionResponse> {
    return withTracing('action.assign_provider', async (span) => {
        try {
            const authResult = await requireRole(UserRole.ADMIN);
            if (authResult.isFailure()) return { success: false, error: authResult.getError().message };
            span.setAttribute('quotation.id', quotationId);
            span.setAttribute('provider.id', providerId);

            const { ApplicationRegistry } = await import('@infrastructure/di/ApplicationRegistry');
            const { AssignProviderCommand } = await import('@core/application/handlers/quotations/AssignProvider');

            const result = await ApplicationRegistry.getCommandBus().dispatch(
                new AssignProviderCommand(quotationId, providerId)
            );

            if (result.isFailure()) {
                return { success: false, error: result.getError().message };
            }

            await triggerN8nWebhook('provider-assigned', { quotationId, providerId });

            revalidatePath('/admin/quotations');
            return { success: true };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: message };
        }
    });
}

/**
 * Set Markup and Approve for Client Review (Admin only)
 */
export async function setMarkupAndApprove(quotationId: string, adminFee: number, totalClientPrice: number): Promise<ActionResponse> {
    return withTracing('action.set_markup', async (span) => {
        try {
            const authResult = await requireRole(UserRole.ADMIN);
            if (authResult.isFailure()) return { success: false, error: authResult.getError().message };
            const { user } = authResult.getValue();
            span.setAttribute('quotation.id', quotationId);
            span.setAttribute('admin_fee', adminFee);

            const { ApplicationRegistry } = await import('@infrastructure/di/ApplicationRegistry');
            const { ApplyMarkupCommand } = await import('@core/application/handlers/quotations/ApplyMarkup');

            const result = await ApplicationRegistry.getCommandBus().dispatch(
                new ApplyMarkupCommand(quotationId, adminFee) // Note: totalClientPrice is calculated inside
            );

            if (result.isFailure()) {
                return { success: false, error: result.getError().message };
            }

            // Security Audit Log (Legacy integration example)
            const { logSecurityEvent } = await import('@/lib/security/audit');
            await logSecurityEvent('SENSITIVE_DATA_ACCESS', user?.id || UserRole.ADMIN, {
                action: 'setMarkupAndApprove',
                quotationId,
                adminFee,
                totalClientPrice
            });

            await triggerN8nWebhook('quotation-ready', { quotationId, totalClientPrice });

            revalidatePath('/admin/quotations');
            return { success: true };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            return { success: false, error: message };
        }
    });
}

/**
 * Analyze Quotation for Bias (AI)
 */
export async function analyzeQuote(quotationId: string): Promise<{ success: boolean; data?: BiasAnalysisOutput; error?: string }> {
    return withTracing('action.analyze_quote', async (span) => {
        try {
            const authResult = await requireRole(UserRole.ADMIN);
            if (authResult.isFailure()) return { success: false, error: authResult.getError().message };
            span.setAttribute('quotation.id', quotationId);

            const { ApplicationRegistry } = await import('@infrastructure/di/ApplicationRegistry');
            const { AnalyzeQuotationCommand } = await import('@core/application/handlers/quotations/AnalyzeQuotation');

            const result = await ApplicationRegistry.getCommandBus().dispatch<BiasAnalysisOutput>(
                new AnalyzeQuotationCommand(createQuotationId(quotationId))
            );

            if (result.isFailure()) {
                return { success: false, error: result.getError().message };
            }

            return { success: true, data: result.getValue() };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: message };
        }
    });
}
