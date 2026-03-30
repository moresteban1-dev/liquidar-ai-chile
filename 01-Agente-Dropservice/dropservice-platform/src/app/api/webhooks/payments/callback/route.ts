import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';

export const GET = withAuth(async (request, _user) => {
    const searchParams = request.nextUrl.searchParams;
    const externalReference = searchParams.get('external_reference'); // Now this is the ORDER ID
    const status = searchParams.get('status') || searchParams.get('collection_status');

    if (!externalReference) {
        return NextResponse.redirect(new URL('/client/quotations', request.url));
    }

    if (status === 'approved' || status === 'success') {
        const supabase = createServiceRoleClient();

        // 1. Fetch Order to confirm existence
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, quotation_id, status')
            .eq('id', externalReference)
            .single();

        if (orderError || !order) {
            logger.error('Callback error: Order not found', externalReference);
            return NextResponse.redirect(new URL(`/client/quotations?error=order_not_found`, request.url));
        }

        // 2. Update Order to PAGADA
        if (order.status !== 'PAID') {
            await supabase
                .from('orders')
                .update({
                    status: 'PAID',
                    payment_status: 'PAID',
                    updated_at: new Date().toISOString()
                })
                .eq('id', order.id);

            // 3. Update Quotation Status to APROBADA if not already
            if (order.quotation_id) {
                await supabase
                    .from('quotations')
                    .update({
                        public_status: 'APPROVED',
                        status: 'APPROVED',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', order.quotation_id);
            }
        }

        // Success redirect
        return NextResponse.redirect(new URL(`/client/orders/${order.id}?payment=success`, request.url));
    }

    // Failure
    return NextResponse.redirect(new URL(`/client/orders/${externalReference}?payment=failure`, request.url));
});
