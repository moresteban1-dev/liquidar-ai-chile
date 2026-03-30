import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { withAdmin } from '@/lib/api/with-security';

export const revalidate = 60; // Cache stats for 60 seconds

/**
 * GET /api/admin/stats/finance
 * Protected: Admin only.
 */
export async function GET(req: Request, context: any) {
    return withAdmin(async () => {
        const supabase = createServiceRoleClient();

        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, created_at, price_total, price_cost, price_net, margin_amount, status')
            .in('status', ['PAID', 'IN_PRODUCTION', 'INTERNAL_REVIEW', 'DELIVERED', 'UNDER_REVIEW', 'COMPLETED'])
            .order('created_at', { ascending: true });

        if (error) throw error;

        const totals = orders.reduce((acc, order) => ({
            revenue: acc.revenue + (order.price_total || 0),
            cost: acc.cost + (order.price_cost || 0),
            margin: acc.margin + (order.margin_amount || 0),
            count: acc.count + 1
        }), { revenue: 0, cost: 0, margin: 0, count: 0 });

        const monthlyData = new Map<string, { name: string, revenue: number, cost: number, margin: number }>();
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            const name = d.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
            monthlyData.set(key, { name, revenue: 0, cost: 0, margin: 0 });
        }

        orders.forEach(order => {
            const date = new Date(order.created_at);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

            if (monthlyData.has(key)) {
                const current = monthlyData.get(key)!;
                current.revenue += order.price_total || 0;
                current.cost += order.price_cost || 0;
                current.margin += order.margin_amount || 0;
            }
        });

        const chartData = Array.from(monthlyData.values());
        const recentTransactions = orders.slice(-5).reverse().map(o => ({
            id: o.id,
            date: o.created_at,
            amount: o.price_total,
            status: o.status
        }));

        return NextResponse.json({
            totals,
            chartData,
            recentTransactions
        });
    }, req, context);
}
