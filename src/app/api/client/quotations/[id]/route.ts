/**
 * Client Quotation Detail API Route - SUPABASE VERSION
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';

export const GET = withAuth(async (_request, user, params) => {
    try {
        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const clientResult = await createApiClient();
    if (clientResult.isFailure()) return NextResponse.json({ error: clientResult.getError().message }, { status: 401 });
    const supabase = clientResult.getValue();

        // Get quotation with client access check
        const { data: quotation, error } = await supabase
            .from('quotations')
            .select(`
                id, code, publicStatus:public_status, status, brief, requirements,
                priceNet:price_net, priceIva:price_iva, priceTotal:price_total, 
                validUntil:valid_until, createdAt:created_at,
                eventStartDate:event_start_date, eventEndDate:event_end_date, 
                eventLocation:event_location, eventAddress:event_address, eventTime:event_time,
                setupTime:setup_time, teardownTime:teardown_time,
                service:services(id, name, description, image_url),
                items:quotation_items(id, description, quantity, category, sort_order),
                orders(id)
            `)
            .eq('id', id)
            .eq('client_id', user.id)
            .single();

        if (error || !quotation) {
            logger.error('Client quotation query failed:', { error, quotationId: id, userId: user.id });
            return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
        }

        return NextResponse.json(quotation);
    } catch (error) {
        logger.error('Error fetching quotation:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
});
