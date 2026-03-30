/**
 * Provider Bid Submit API - SUPABASE VERSION
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { notifyNewBid } from '@/lib/notifications';
import { buildStatusUpdate } from '@/lib/quotation-fsm';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

export const POST = withAuth(async (request, user, params) => {
    try {
        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const supabase = createServiceRoleClient();

        const body = await request.json();
        const { priceCost, deliveryDays, notes } = body;

        if (!priceCost || !deliveryDays) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Security Check: Ensure provider is assigned to this quotation
        const { data: quotation, error: quoteError } = await supabase
            .from('quotations')
            .select('assigned_provider_id, code, status')
            .eq('id', id)
            .single();

        if (quoteError || !quotation) {
            return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
        }

        if (quotation.assigned_provider_id !== user.id) {
            logger.warn(`[Security] Unauthorized bid attempt by ${user.id} on quote ${id} assigned to ${quotation.assigned_provider_id}`);
            return NextResponse.json({ error: 'Not authorized to bid on this quotation' }, { status: 403 });
        }

        // Status validation: only accept bids when quotation is awaiting provider bid
        if (quotation.status !== 'PENDING_PROVIDER_BID') {
            return NextResponse.json(
                { error: 'Esta cotización no está recibiendo ofertas' },
                { status: 400 }
            );
        }

        // Create Bid
        const { data: bid, error: bidError } = await supabase
            .from('provider_bids')
            .insert({
                quotation_id: id,
                provider_id: user.id,
                price_cost: Number(priceCost),
                delivery_days: Number(deliveryDays),
                notes: notes,
                status: 'PENDIENTE'
            })
            .select()
            .single();

        if (bidError) {
            logger.error('Error creating bid:', bidError);
            return NextResponse.json({ error: 'Error creating bid' }, { status: 500 });
        }

        // Update status — buildStatusUpdate syncs the 3 fields automatically
        await supabase
            .from('quotations')
            .update(buildStatusUpdate('PENDING_ADMIN_APPROVAL'))
            .eq('id', id);

        // Audit trail: log status change
        await supabase.from('quotation_history').insert({
            quotation_id: id,
            previous_status: quotation.status,
            new_status: 'PENDING_ADMIN_APPROVAL',
            actor_id: user.id,
            actor_type: UserRole.VENDOR,
            comment: `Oferta enviada: $${Number(priceCost).toLocaleString('es-CL')} CLP, ${deliveryDays} días`,
        }).then(({ error }) => {
            if (error) logger.error('Error logging history:', error);
        });

        // Send notification to admin
        notifyNewBid({
            quoteCode: quotation.code,
            providerName: user.name || 'Proveedor',
            priceCost: Number(priceCost),
            deliveryDays: Number(deliveryDays),
        }).catch(err => logger.error('Email send error:', err));

        return NextResponse.json(bid);
    } catch (error) {
        logger.error('Error submitting bid:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}, { roles: [UserRole.VENDOR] });
