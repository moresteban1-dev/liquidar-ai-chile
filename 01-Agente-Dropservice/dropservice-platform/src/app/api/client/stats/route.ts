/**
 * Client Stats API Route - SUPABASE VERSION
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';

export const GET = withAuth(async (_request, user) => {
    try {
        const clientResult = await createApiClient();
    if (clientResult.isFailure()) return NextResponse.json({ error: clientResult.getError().message }, { status: 401 });
    const supabase = clientResult.getValue();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Total Spent (completed orders)
        const { data: completedOrders } = await supabase
            .from('orders')
            .select('price_total')
            .eq('client_id', user.id)
            .in('status', ['COMPLETED', 'DELIVERED', 'PAID', 'IN_PRODUCTION', 'INTERNAL_REVIEW', 'UNDER_REVIEW']);

        const totalSpent = (completedOrders || []).reduce((acc: number, order: any) => acc + (order.price_total || 0), 0);

        // Active Orders
        const { count: activeOrdersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', user.id)
            .not('status', 'in', '("COMPLETED","REFUNDED")');

        // Completed Orders
        const { count: completedOrdersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', user.id)
            .eq('status', 'COMPLETED');

        return NextResponse.json({
            totalSpent: { value: totalSpent, change: { value: 0, trend: 'neutral' } },
            activeOrders: { value: activeOrdersCount || 0, change: { value: 0, trend: 'neutral' } },
            completedOrders: { value: completedOrdersCount || 0, change: { value: 0, trend: 'neutral' } },
            avgDeliveryTime: { value: "3.5 days", change: { value: 0, trend: 'neutral' } }
        });
    } catch (error) {
        logger.error('Error fetching client stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});
