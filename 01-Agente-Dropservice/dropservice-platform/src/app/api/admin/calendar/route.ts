import { createApiClient } from '@/lib/supabase/api';
import { NextRequest, NextResponse } from 'next/server';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';

/**
 * Admin Calendar API
 * Aggregates confirmed orders to visualize equipment usage timeline.
 */
export const GET = adminRoute(async (_req: NextRequest, _ctx: MiddlewareContext) => {
    const clientResult = await createApiClient();
    if (clientResult.isFailure()) return NextResponse.json({ error: clientResult.getError().message }, { status: 401 });
    const supabase = clientResult.getValue();

    // 1. Fetch confirmed orders with items
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id, 
            code,
            event_start_date, 
            event_end_date,
            status,
            items:order_items(
                quantity,
                service:services(name)
            )
        `)
        .in('status', ['PAID', 'IN_PRODUCTION', 'INTERNAL_REVIEW', 'DELIVERED', 'UNDER_REVIEW', 'COMPLETED'])
        .not('event_start_date', 'is', null)
        .order('event_start_date', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Transform into Calendar Events
    const events = (orders || []).map(order => ({
        id: order.id,
        title: `${order.code} - ${order.items?.length || 0} items`,
        start: order.event_start_date,
        end: order.event_end_date,
        status: order.status,
        resource: order.items?.map((item: any) => {
            const serviceName = Array.isArray(item.service) ? item.service[0]?.name : item.service?.name;
            return `${serviceName} (x${item.quantity})`;
        }).join(', ')
    }));

    return NextResponse.json(events);
});
