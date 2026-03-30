import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { calculateCommission, CommissionInput, buildStatusUpdate } from '@/lib/quotation-fsm';
import { validateRequestBody } from '@/lib/validators/api-validator';
import { CommissionSchema } from '@/lib/validators/api-schemas';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

interface ClientItemPayload {
    description: string;
    quantity: number;
    unitPriceNet: number;
}

/**
 * POST /api/quotations/[id]/commission
 */
export const POST = withAuth(async (request, user, params) => {
    try {
        const quotationId = params?.id;
        if (!quotationId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const validation = await validateRequestBody(request, CommissionSchema);
        if (!validation.success) return validation.response;
        
        const {
            commissionMethod,
            globalPercentage,
            servicesPercentage,
            logisticsPercentage,
            fixedCommissionServices,
            fixedCommissionLogistics,
            clientItems,
            validDays = 7,
        } = validation.data;

        // Validate client items
        if (!Array.isArray(clientItems) || clientItems.length === 0) {
            return NextResponse.json(
                { error: 'Debe incluir al menos una línea para el cliente' },
                { status: 400 }
            );
        }

        for (const item of clientItems) {
            if (!item.description?.trim()) {
                return NextResponse.json(
                    { error: 'Cada línea debe tener una descripción' },
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

        // Fetch quotation with provider subtotals
        const { data: quotation, error: fetchErr } = await supabase
            .from('quotations')
            .select('id, status, subtotal_services_provider, subtotal_logistics_provider')
            .eq('id', quotationId)
            .single();

        if (fetchErr || !quotation) {
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }

        if (quotation.status !== 'PENDING_ADMIN_APPROVAL') {
            return NextResponse.json(
                { error: `No se puede agregar comisión en estado: ${quotation.status}` },
                { status: 400 }
            );
        }

        // Calculate commission using the FSM engine
        const commInput: CommissionInput = {
            method: commissionMethod,
            subtotalServicesProvider: quotation.subtotal_services_provider || 0,
            subtotalLogisticsProvider: quotation.subtotal_logistics_provider || 0,
            fixedCommissionServices,
            fixedCommissionLogistics,
            globalPercentage,
            servicesPercentage,
            logisticsPercentage,
        };

        const result = calculateCommission(commInput);

        // Delete previous client items (in case of re-edit)
        await supabase
            .from('quotation_client_items')
            .delete()
            .eq('quotation_id', quotationId);

        // Insert reformulated client items
        const clientItemRecords = clientItems.map((item: ClientItemPayload, index: number) => ({
            quotation_id: quotationId,
            description: item.description.trim(),
            quantity: item.quantity || 1,
            unit_price_net: Math.round(item.unitPriceNet),
            total_price_net: Math.round(item.unitPriceNet * (item.quantity || 1)),
            sort_order: index,
        }));

        const { error: insertErr } = await supabase
            .from('quotation_client_items')
            .insert(clientItemRecords);

        if (insertErr) {
            logger.error('Error inserting client items:', insertErr);
            return NextResponse.json(
                { error: 'Error guardando líneas del cliente' },
                { status: 500 }
            );
        }

        // Compute validity date
        const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();

        // Update quotation with commission results and transition
        const { error: updateErr } = await supabase
            .from('quotations')
            .update(buildStatusUpdate('AWAITING_CLIENT_PAYMENT', {
                commission_method: commissionMethod,
                commission_services_net: result.commissionServicesNet,
                commission_logistics_net: result.commissionLogisticsNet,
                total_commission_net: result.totalCommissionNet,
                total_net: result.totalNet,
                total_iva: result.totalIva,
                total_with_iva: result.totalWithIva,
                // Legacy fields for backward compat
                price_net: result.totalNet,
                price_iva: result.totalIva,
                price_total: result.totalWithIva,
                markup_amount: result.totalCommissionNet,
                valid_until: validUntil,
                sent_to_client_at: new Date().toISOString(),
            }))
            .eq('id', quotationId);

        if (updateErr) {
            logger.error('Error updating quotation:', updateErr);
            return NextResponse.json(
                { error: 'Error actualizando cotización' },
                { status: 500 }
            );
        }

        // Register history
        await supabase.from('quotation_history').insert({
            quotation_id: quotationId,
            previous_status: 'PENDING_ADMIN_APPROVAL',
            new_status: 'AWAITING_CLIENT_PAYMENT',
            actor_id: user.id,
            actor_type: UserRole.ADMIN,
            comment: `Comisión aplicada (${commissionMethod}). Total cliente: ${result.totalWithIva}`,
        });

        return NextResponse.json({
            success: true,
            ...result,
            validUntil,
        });

    } catch (error) {
        logger.error('Error in commission route:', error);
        const message = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}, { roles: [UserRole.ADMIN] });
