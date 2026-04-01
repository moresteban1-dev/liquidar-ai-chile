'use server';

/**
 * submitProviderBidAction — Server Action for vendors to submit itemized quotes.
 * Migrates logic from /api/quotations/[id]/provider-quote REST endpoint to a
 * type-safe Server Action with proper validation and error handling.
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClient, getAuthUser } from '@/lib/supabase/api';
import { buildStatusUpdate } from '@/lib/quotation-fsm';
import { notifyNewBid } from '@/lib/notifications';
import { UserRole } from '@/core/domain/auth/UserRole';

// ─── Input Types ────────────────────────────────────────────────────────────

interface ProviderItemInput {
    category: 'SERVICIO' | 'LOGISTICA';
    concept: string;
    quantity: number;
    unitPriceNet: number;
    catalogItemId?: string | null;
}

interface SubmitProviderBidInput {
    quotationId: string;
    items: ProviderItemInput[];
    providerNotes?: string;
    deliveryDays?: number;
    suggestsTechnicalVisit?: boolean;
}

// ─── Response Types ─────────────────────────────────────────────────────────

interface SubmitProviderBidResult {
    success: boolean;
    error?: string;
    subtotalServices?: number;
    subtotalLogistics?: number;
    totalProviderNet?: number;
    itemCount?: number;
}

// ─── Validation ─────────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set(['SERVICIO', 'LOGISTICA']);

function validateItems(items: ProviderItemInput[]): string | null {
    if (!Array.isArray(items) || items.length === 0) {
        return 'Debe incluir al menos un item';
    }

    let i = 0;
    for (const item of items) {
        if (!item) continue;
        
        if (!VALID_CATEGORIES.has(item.category)) {
            return `Item ${i + 1}: Categoría inválida "${item.category}"`;
        }
        if (!item.concept || typeof item.concept !== 'string' || !item.concept.trim()) {
            return `Item ${i + 1}: Debe tener una descripción`;
        }
        if (!item.quantity || item.quantity < 1) {
            return `Item ${i + 1}: Cantidad debe ser ≥ 1`;
        }
        if (typeof item.unitPriceNet !== 'number' || item.unitPriceNet < 0) {
            return `Item ${i + 1}: Precio unitario debe ser ≥ 0`;
        }
        i++;
    }

    return null;
}

// ─── Main Action ────────────────────────────────────────────────────────────

export async function submitProviderBidAction(
    input: SubmitProviderBidInput
): Promise<SubmitProviderBidResult> {
    try {
        // 1. Auth — verify user is a provider
        const userRes = await getAuthUser();
        if (userRes.isFailure()) {
            return { success: false, error: 'No autorizado: ' + userRes.getError().message };
        }
        
        const user = userRes.getValue();
        if (user.role !== UserRole.VENDOR) {
            return { success: false, error: 'Solo proveedores pueden enviar cotizaciones' };
        }

        // 1b. Sanitize inputs against XSS (H4)
        const { sanitizeRichText, sanitizePlainText } = await import('@/lib/security/xss');
        if (input.providerNotes) {
            input.providerNotes = sanitizeRichText(input.providerNotes);
        }
        for (const item of input.items) {
            item.concept = sanitizePlainText(item.concept);
        }

        // 2. Validate inputs
        const validationError = validateItems(input.items);
        if (validationError) {
            return { success: false, error: validationError };
        }

        const supabase = createServiceRoleClient();

        // 3. Verify quotation exists and belongs to this provider
        const { data: quotation, error: fetchErr } = await supabase
            .from('quotations')
            .select('id, code, assigned_provider_id, status')
            .eq('id', input.quotationId)
            .single();

        if (fetchErr || !quotation) {
            return { success: false, error: 'Cotización no encontrada' };
        }
        if (quotation.assigned_provider_id !== user.id) {
            return { success: false, error: 'No estás asignado a esta cotización' };
        }
        if (quotation.status !== 'PENDING_PROVIDER_BID') {
            return { success: false, error: `No se puede cotizar en estado: ${quotation.status}` };
        }

        // 4. Clear previous provider items (supports re-quote)
        await supabase
            .from('quotation_provider_items')
            .delete()
            .eq('quotation_id', input.quotationId);

        // 5. Insert provider items
        const providerItems = input.items.map((item, index) => ({
            quotation_id: input.quotationId,
            category: item.category,
            concept: item.concept.trim(),
            quantity: item.quantity,
            unit_price_net: Math.round(item.unitPriceNet),
            total_price_net: Math.round(item.unitPriceNet * item.quantity),
            sort_order: index,
            catalog_item_id: item.catalogItemId || null,
        }));

        const { error: insertErr } = await supabase
            .from('quotation_provider_items')
            .insert(providerItems);

        if (insertErr) {
            logger.error('[submitProviderBid] Insert items error:', insertErr);
            return { success: false, error: 'Error guardando items del proveedor' };
        }

        // 6. Calculate subtotals
        const subtotalServices = providerItems
            .filter(i => i.category === 'SERVICIO')
            .reduce((sum, i) => sum + i.total_price_net, 0);

        const subtotalLogistics = providerItems
            .filter(i => i.category === 'LOGISTICA')
            .reduce((sum, i) => sum + i.total_price_net, 0);

        const totalProviderNet = subtotalServices + subtotalLogistics;

        // 7. Create bid record for history
        await supabase.from('provider_bids').insert({
            quotation_id: input.quotationId,
            provider_id: user.id,
            cost_amount: totalProviderNet,
            delivery_days: input.deliveryDays ? Number(input.deliveryDays) : 0,
            notes: input.providerNotes?.trim(),
            status: 'SUBMITTED',
        });

        // 8. Transition quotation status to PENDING_ADMIN_APPROVAL
        const { error: updateErr } = await supabase
            .from('quotations')
            .update(buildStatusUpdate('PENDING_ADMIN_APPROVAL', {
                subtotal_services_provider: subtotalServices,
                subtotal_logistics_provider: subtotalLogistics,
                total_provider_net: totalProviderNet,
                provider_cost: totalProviderNet, // Legacy field compatibility
                provider_notes: input.providerNotes?.trim() || null,
                provider_quoted_at: new Date().toISOString(),
                provider_suggests_technical_visit: input.suggestsTechnicalVisit ?? false,
            }))
            .eq('id', input.quotationId);

        if (updateErr) {
            logger.error('[submitProviderBid] Update quotation error:', updateErr);
            return { success: false, error: 'Error actualizando cotización' };
        }

        // 9. Register history entry
        await supabase.from('quotation_history').insert({
            quotation_id: input.quotationId,
            previous_status: 'PENDING_PROVIDER_BID',
            new_status: 'PENDING_ADMIN_APPROVAL',
            actor_id: user.id,
            actor_type: UserRole.VENDOR,
            comment: input.providerNotes?.trim() || 'Proveedor envió cotización desglosada',
        });

        // 10. Notify admin (fire-and-forget)
        notifyNewBid({
            quoteCode: quotation.code || input.quotationId,
            providerName: user.name || user.email || 'Proveedor',
            priceCost: totalProviderNet,
            deliveryDays: input.deliveryDays ? Number(input.deliveryDays) : 0,
        }).catch(err => logger.error('[Notifications] New bid error:', err));

        return {
            success: true,
            subtotalServices,
            subtotalLogistics,
            totalProviderNet,
            itemCount: providerItems.length,
        };
    } catch (error) {
        logger.error('[submitProviderBid] Unexpected error:', error);
        const message = error instanceof Error ? error.message : 'Error interno';
        return { success: false, error: message };
    }
}
