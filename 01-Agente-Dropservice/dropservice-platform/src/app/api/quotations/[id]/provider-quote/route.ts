/**
 * Provider Quote API Route
 * POST: Proveedor envía cotización desglosada (servicios + logística)
 * Guarda items en quotation_provider_items y transiciona el estado.
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { buildStatusUpdate } from '@/lib/quotation-fsm';
import { notifyNewBid } from '@/lib/notifications';
import { logDiagnostic } from '@/lib/server-logger';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

interface ProviderItemPayload {
    category: 'SERVICIO' | 'LOGISTICA';
    concept: string;
    quantity: number;
    unitPriceNet: number;
    catalogItemId?: string | null;
}

/**
 * POST /api/quotations/[id]/provider-quote
 * Body: { items: ProviderItemPayload[], providerNotes?: string, deliveryDays?: number }
 */
export const POST = withAuth(async (request, user, params) => {
    try {
        const quotationId = params?.id;
        if (!quotationId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        if (user.role !== UserRole.VENDOR) {
            return NextResponse.json({ error: 'Solo proveedores' }, { status: 403 });
        }

        const body = await request.json();
        const { items, providerNotes, deliveryDays, suggestsTechnicalVisit } = body;

        logDiagnostic(`\n[API] Vendor ${user.email} received quota payload: ${JSON.stringify(body)}`);

        // Validate items array
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Debe incluir al menos un item' },
                { status: 400 }
            );
        }

        const validCategories = ['SERVICIO', 'LOGISTICA'];
        for (const item of items) {
            if (!validCategories.includes(item.category)) {
                return NextResponse.json(
                    { error: `Categoría inválida: ${item.category}` },
                    { status: 400 }
                );
            }
            if (!item.concept || typeof item.concept !== 'string') {
                return NextResponse.json(
                    { error: 'Cada item debe tener un concepto' },
                    { status: 400 }
                );
            }
            if (!item.quantity || item.quantity < 1) {
                return NextResponse.json(
                    { error: 'Cantidad debe ser >= 1' },
                    { status: 400 }
                );
            }
            if (typeof item.unitPriceNet !== 'number' || item.unitPriceNet < 0) {
                return NextResponse.json(
                    { error: 'Precio unitario debe ser >= 0' },
                    { status: 400 }
                );
            }
        }

        const supabase = createServiceRoleClient();

        // Verify quotation exists and is assigned to this provider
        const { data: quotation, error: fetchErr } = await supabase
            .from('quotations')
            .select('id, code, assigned_provider_id, status')
            .eq('id', quotationId)
            .single();

        if (fetchErr || !quotation) {
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }

        if (quotation.assigned_provider_id !== user.id) {
            return NextResponse.json(
                { error: 'No estás asignado a esta cotización' },
                { status: 403 }
            );
        }

        if (quotation.status !== 'PENDING_PROVIDER_BID') {
            return NextResponse.json(
                { error: `No se puede cotizar en estado: ${quotation.status}` },
                { status: 400 }
            );
        }

        // Delete previous provider items (in case of re-quote)
        await supabase
            .from('quotation_provider_items')
            .delete()
            .eq('quotation_id', quotationId);

        // Insert provider items
        const providerItems = items.map((item: ProviderItemPayload, index: number) => ({
            quotation_id: quotationId,
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
            logger.error('Error inserting provider items:', insertErr);
            logDiagnostic(`[API] Error DB Items: ${insertErr.message}`);
            return NextResponse.json(
                { error: 'Error guardando items del proveedor' },
                { status: 500 }
            );
        }

        // Calculate subtotals
        const subtotalServices = providerItems
            .filter((i: { category: string }) => i.category === 'SERVICIO')
            .reduce((sum: number, i: { total_price_net: number }) => sum + i.total_price_net, 0);

        const subtotalLogistics = providerItems
            .filter((i: { category: string }) => i.category === 'LOGISTICA')
            .reduce((sum: number, i: { total_price_net: number }) => sum + i.total_price_net, 0);

        const totalProviderNet = subtotalServices + subtotalLogistics;

        // Save Bid Record (Legacy support + Delivery Days storage)
        const { error: bidErr } = await supabase.from('provider_bids').insert({
            quotation_id: quotationId,
            provider_id: user.id,
            cost_amount: totalProviderNet,
            delivery_days: deliveryDays ? Number(deliveryDays) : 0,
            notes: providerNotes?.trim(),
            status: 'SUBMITTED' 
        });

        if (bidErr) {
            logDiagnostic(`[API] Error insertando en provider_bids: JSON: ${JSON.stringify(bidErr)}`);
        }

        // Update quotation with subtotals and transition status
        const { error: updateErr } = await supabase
            .from('quotations')
            .update(buildStatusUpdate('PENDING_ADMIN_APPROVAL', {
                subtotal_services_provider: subtotalServices,
                subtotal_logistics_provider: subtotalLogistics,
                total_provider_net: totalProviderNet,
                provider_cost: totalProviderNet, // Legacy field compatibility
                provider_notes: providerNotes?.trim() || null,
                provider_quoted_at: new Date().toISOString(),
                provider_suggests_technical_visit: suggestsTechnicalVisit ?? false,
            }))
            .eq('id', quotationId);

        if (updateErr) {
            logger.error('Error updating quotation:', updateErr);
            logDiagnostic(`[API] Error actualizando Cotizacion a PENDING_ADMIN_APPROVAL: ${JSON.stringify(updateErr)}`);
            return NextResponse.json(
                { error: 'Error actualizando cotización' },
                { status: 500 }
            );
        }

        // Register history entry
        await supabase.from('quotation_history').insert({
            quotation_id: quotationId,
            previous_status: 'PENDING_PROVIDER_BID',
            new_status: 'PENDING_ADMIN_APPROVAL',
            actor_id: user.id,
            actor_type: UserRole.VENDOR,
            comment: providerNotes?.trim() || 'Proveedor envió cotización desglosada',
        });

        // Send notification to Admin
        notifyNewBid({
            quoteCode: quotation.code || quotationId,
            providerName: user.name || user.email || 'Proveedor',
            priceCost: totalProviderNet,
            deliveryDays: deliveryDays ? Number(deliveryDays) : 0,
        }).catch(err => logger.error('[Notifications] Error sending new bid notification:', err));

        // Enqueue background task for Negotiator Agent (AI Analysis of the bid)
        try {
            import('@infrastructure/queue/queue.factory').then(({ getQueue, QUEUE_NAMES }) => {
                const negotiatorQueue = getQueue(QUEUE_NAMES.NEGOTIATOR_JOBS);
                negotiatorQueue.add('negotiator-analysis', {
                    quotationId,
                    providerId: user.id
                }).catch(queueErr => {
                    logger.error('[provider-quote] Falló al encolar el Negotiator Agent:', queueErr);
                });
            }).catch(importErr => {
                logger.error('[provider-quote] Queue module unavailable:', importErr);
            });
        } catch (queueErr) {
            logger.error('[provider-quote] Falló al inicializar el Negotiator Agent:', queueErr);
        }

        return NextResponse.json({
            success: true,
            subtotalServices,
            subtotalLogistics,
            totalProviderNet,
            itemCount: providerItems.length,
        });

    } catch (error) {
        logger.error('Error in provider-quote:', error);
        const message = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: message }, { status: 500 });
    }
});
