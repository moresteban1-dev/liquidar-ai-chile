import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { diContainer } from '@infrastructure/di/CoreContainer';
import { validateRequestBody } from '@/lib/validators/api-validator';
import { SubmitBidSchema } from '@/lib/validators/api-schemas';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

/**
 * GET /api/quotations/[id]/bids - List bids (admin only)
 */
export const GET = withAuth(async (_request, user, params) => {
    try {
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
        }

        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const supabase = createServiceRoleClient();

        const { data: bids, error } = await supabase
            .from('provider_bids')
            .select(`
                *,
                provider:profiles(
                    id, name, email,
                    provider_profiles(rating, completed_orders, specialty)
                )
            `)
            .eq('quotation_id', id)
            .order('price_cost', { ascending: true });

        if (error) {
            logger.error('Error fetching bids:', error);
            return NextResponse.json({ error: 'Error al obtener ofertas' }, { status: 500 });
        }

        return NextResponse.json(bids || []);
    } catch (error) {
        logger.error('Error fetching bids:', error);
        return NextResponse.json({ error: 'Error al obtener ofertas' }, { status: 500 });
    }
});

/**
 * POST /api/quotations/[id]/bids - Submit bid (provider only)
 */
export const POST = withAuth(async (request, user, params) => {
    try {
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        if (user.role !== UserRole.VENDOR) {
            return NextResponse.json({ error: 'Solo proveedores' }, { status: 403 });
        }

        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const validation = await validateRequestBody(request, SubmitBidSchema);
        if (!validation.success) return validation.response;
        const { priceCost, deliveryDays, notes } = validation.data;

        const supabase = createServiceRoleClient();

        // Check quotation exists and is accepting bids
        const { data: quotation, error: quotationError } = await supabase
            .from('quotations')
            .select('status')
            .eq('id', id)
            .single();

        if (quotationError || !quotation) {
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }

        if (!['PENDING_PROVIDER_BID'].includes(quotation.status)) {
            return NextResponse.json(
                { error: 'Esta cotización no está recibiendo ofertas' },
                { status: 400 }
            );
        }

        // Check if provider already sent a bid
        const { data: existingBid } = await supabase
            .from('provider_bids')
            .select('id')
            .eq('quotation_id', id)
            .eq('provider_id', user.id)
            .single();

        if (existingBid) {
            return NextResponse.json(
                { error: 'Ya enviaste una oferta para esta cotización' },
                { status: 400 }
            );
        }

        // Create bid
        const { data: bid, error: bidError } = await supabase
            .from('provider_bids')
            .insert({
                quotation_id: id,
                provider_id: user.id,
                price_cost: priceCost,
                delivery_days: deliveryDays,
                notes,
                status: 'PENDIENTE',
                responded_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (bidError) {
            logger.error('Error creating bid:', bidError);
            return NextResponse.json({ error: 'Error al enviar oferta' }, { status: 500 });
        }

        // Update quotation status if first bid
        if (quotation.status === 'PENDING_PROVIDER_BID') {
            try {
                await diContainer.getQuotationService().transitionQuotation(id, 'PENDING_ADMIN_APPROVAL' as any);
            } catch (e) {
                logger.warn('Could not transition quotation', { error: String(e) });
            }
        }

        return NextResponse.json({
            success: true,
            bid,
            message: '¡Oferta enviada correctamente!',
        });
    } catch (error) {
        logger.error('Error creating bid:', error);
        return NextResponse.json({ error: 'Error al enviar oferta' }, { status: 500 });
    }
});
