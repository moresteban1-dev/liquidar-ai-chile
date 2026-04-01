import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdmin } from '@/lib/api/with-auth';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache analytics for 1 hour

/**
 * GET /api/admin/stats/analytics
 * Protected: Admin only.
 */
export const GET = withAdmin(async (_req, _user) => {
    const supabase = await createClient();

    // Fetch Quotations
    const { data: quotations, error } = await supabase
        .from('quotations')
        .select('id, created_at, status, total_client_price, total_commission_net');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Calculate Key Metrics
    const totalOrders = quotations.length;
    const paidOrders = quotations.filter(o => ['PAID', 'FULFILLED'].includes(o.status));
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_client_price || 0), 0);
    const activeOrders = quotations.filter(o => ['APPROVED', 'PAID'].includes(o.status)).length;
    const pendingOrders = quotations.filter(o => ['PENDING_ASSIGNMENT', 'PENDING_PROVIDER_BID', 'PENDING_ADMIN_APPROVAL', 'AWAITING_CLIENT_PAYMENT'].includes(o.status)).length;

    // 3. Revenue by Month (Last 6 Months)
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    const monthlyRevenueMap = new Map<string, number>();

    for (let i = 0; i < 6; i++) {
        const date = subMonths(new Date(), i);
        const key = format(date, 'yyyy-MM');
        monthlyRevenueMap.set(key, 0);
    }

    paidOrders.forEach(order => {
        const date = parseISO(order.created_at);
        if (date >= sixMonthsAgo) {
            const key = format(date, 'yyyy-MM');
            const current = monthlyRevenueMap.get(key) || 0;
            monthlyRevenueMap.set(key, current + (order.total_client_price || 0));
        }
    });

    const revenueChartData = Array.from(monthlyRevenueMap.entries())
        .map(([key, value]) => {
            const parts = key.split('-');
            const year = parts[0] || '2024';
            const month = parts[1] || '01';
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
                name: format(date, 'MMM', { locale: es }),
                fullDate: key,
                revenue: value
            };
        })
        .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

    const STATUS_LABELS: Record<string, string> = {
        DRAFT: 'Borrador',
        PENDING_ASSIGNMENT: 'Pendiente Asignación',
        PENDING_PROVIDER_BID: 'Cotizando Proveedor',
        PENDING_ADMIN_APPROVAL: 'Por Aprobar',
        AWAITING_CLIENT_PAYMENT: 'Esperando Pago',
        APPROVED: 'Aprobada',
        PAID: 'Pagada',
        FULFILLED: 'Completada',
        CANCELLED: 'Cancelada',
        REJECTED: 'Rechazada',
    };
    const statusMap = new Map<string, number>();
    quotations.forEach(q => {
        const label = STATUS_LABELS[q.status] || q.status;
        const current = statusMap.get(label) || 0;
        statusMap.set(label, current + 1);
    });

    const statusChartData = Array.from(statusMap.entries()).map(([name, value]) => ({
        name,
        value
    }));

    return NextResponse.json({
        metrics: {
            totalOrders,
            totalRevenue,
            activeOrders,
            pendingOrders
        },
        charts: {
            revenue: revenueChartData,
            status: statusChartData
        }
    });
});
