/**
 * Dashboard Statistics API - SUPABASE VERSION
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

export const revalidate = 60; // Cache dashboard stats for 60 seconds

export const GET = withAuth(async (_request, user) => {
    try {
        const supabase = await createApiClient();

        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

        // Fetch stats in parallel
        const results = await Promise.all([
            supabase.from('quotations').select('*', { count: 'exact', head: true }),
            supabase.from('quotations').select('*', { count: 'exact', head: true })
                .in('status', ['PENDING_ASSIGNMENT', 'PENDING_PROVIDER_BID', 'PENDING_ADMIN_APPROVAL']),
            supabase.from('orders').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth),
            supabase.from('orders').select('*', { count: 'exact', head: true })
                .gte('created_at', startOfLastMonth)
                .lte('created_at', endOfLastMonth),
            supabase.from('orders')
                .select(`*, client:profiles!orders_client_id_fkey(name)`)
                .order('created_at', { ascending: false })
                .limit(5),
            supabase.from('quotations')
                .select(`*, client:profiles!quotations_client_id_fkey(name), service:services(name)`)
                .order('created_at', { ascending: false })
                .limit(5),
            supabase.from('orders')
                .select('price_total, margin_amount, created_at'),
        ]);

        const [
            { count: totalQuotations },
            { count: pendingQuotations },
            { count: totalOrders },
            { count: ordersThisMonth },
            { count: ordersLastMonth },
            { data: recentOrders },
            { data: recentQuotations },
            { data: allOrders },
        ] = results as any[];

        // Calculate revenue
        const orders = allOrders || [];
        const totalRevenue = orders.reduce((sum: number, o: { price_total: number }) => sum + (o.price_total || 0), 0);
        const totalMargin = orders.reduce((sum: number, o: { margin_amount: number }) => sum + (o.margin_amount || 0), 0);

        const revenueThisMonth = orders
            .filter((o: { created_at: string }) => new Date(o.created_at) >= new Date(startOfMonth))
            .reduce((sum: number, o: { price_total: number }) => sum + (o.price_total || 0), 0);

        const revenueLastMonth = orders
            .filter((o: { created_at: string }) => {
                const d = new Date(o.created_at);
                return d >= new Date(startOfLastMonth) && d <= new Date(endOfLastMonth);
            })
            .reduce((sum: number, o: { price_total: number }) => sum + (o.price_total || 0), 0);

        const revenueGrowth = revenueLastMonth > 0
            ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
            : 0;

        const ordersGrowth = (ordersLastMonth || 0) > 0
            ? (((ordersThisMonth || 0) - (ordersLastMonth || 0)) / (ordersLastMonth || 1)) * 100
            : 0;

        // Quotations by status (simplified)
        const { data: statusCounts } = await supabase
            .from('quotations')
            .select('status');

        const quotationsByStatus = Object.entries(
            (statusCounts || []).reduce((acc: Record<string, number>, q: { status: string }) => {
                acc[q.status] = (acc[q.status] || 0) + 1;
                return acc;
            }, {})
        ).map(([status, count]: [string, any]) => ({ status, count }));

        return NextResponse.json({
            kpis: {
                totalRevenue,
                revenueThisMonth,
                revenueGrowth: Math.round(revenueGrowth),
                totalMargin,
                marginPercentage: totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 100) : 0,
                totalOrders: totalOrders || 0,
                ordersThisMonth: ordersThisMonth || 0,
                ordersGrowth: Math.round(ordersGrowth),
                totalQuotations: totalQuotations || 0,
                pendingQuotations: pendingQuotations || 0,
            },
            recentOrders: recentOrders || [],
            recentQuotations: recentQuotations || [],
            quotationsByStatus,
        });
    } catch (error) {
        logger.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
    }
});
