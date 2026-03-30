/**
 * Vendor Dashboard Statistics API
 * Returns stats specific to the authenticated provider
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';
import { withAuth } from '@/lib/api/with-auth';
import { UserRole } from '@/core/domain/auth/UserRole';

export const GET = withAuth(async (_request, user) => {
    try {
        const clientResult = await createApiClient();
    if (clientResult.isFailure()) return NextResponse.json({ error: clientResult.getError().message }, { status: 401 });
    const supabase = clientResult.getValue();

        if (user.role !== UserRole.VENDOR) {
            return NextResponse.json({ error: 'Solo proveedores' }, { status: 403 });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Get orders assigned to this provider
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id, code, status, price_cost, created_at, 
                quotation:quotations(brief, event_start_date, service:services(name))
            `)
            .eq('provider_id', user.id)
            .order('created_at', { ascending: false });

        if (ordersError) {
            logger.error('Error fetching vendor orders:', ordersError);
            return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
        }

        // Get quotations awaiting provider bid
        const { data: pendingQuotations, error: quotationsError } = await supabase
            .from('quotations')
            .select(`
                id, code, brief, created_at, status,
                service:services(name)
            `)
            .eq('assigned_provider_id', user.id)
            .in('status', ['PENDING_PROVIDER_BID', 'PENDING_ADMIN_APPROVAL'])
            .order('created_at', { ascending: false });

        if (quotationsError) {
            logger.error('Error fetching pending quotations:', quotationsError);
        }

        // Calculate metrics
        const allOrders = orders || [];
        const activeOrders = allOrders.filter(o =>
            ['PAID', 'IN_PRODUCTION', 'INTERNAL_REVIEW'].includes(o.status)
        );
        const completedOrders = allOrders.filter(o => o.status === 'COMPLETED');
        const completedThisMonth = allOrders.filter(o =>
            o.status === 'COMPLETED' && new Date(o.created_at) >= new Date(startOfMonth)
        );

        // Earnings = sum of price_cost for completed orders (what provider gets paid)
        const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.price_cost || 0), 0);
        const earningsThisMonth = completedThisMonth.reduce((sum, o) => sum + (o.price_cost || 0), 0);

        // Helper to safely extract nested relation value
        const getNestedName = (data: unknown): string => {
            if (!data) return '';
            if (Array.isArray(data) && data.length > 0) {
                const first = data[0] as Record<string, unknown>;
                return (first?.name as string) || '';
            }
            return ((data as Record<string, unknown>)?.name as string) || '';
        };

        return NextResponse.json({
            metrics: {
                totalEarnings,
                earningsThisMonth,
                activeOrders: activeOrders.length,
                completedThisMonth: completedThisMonth.length,
                pendingBids: (pendingQuotations || []).length,
            },
            activeOrders: activeOrders.slice(0, 10).map(o => {
                const orderData = o as Record<string, unknown>;
                const quotationData = (Array.isArray(orderData.quotation) ? orderData.quotation[0] : orderData.quotation) as Record<string, unknown> | null;

                return {
                    id: o.id,
                    code: o.code,
                    status: o.status,
                    payout: o.price_cost || 0,
                    client: 'Cliente',
                    service: getNestedName(quotationData?.service) || 'Servicio',
                    deadline: (quotationData?.event_start_date as string) || null,
                    brief: (quotationData?.brief as string) || '',
                };
            }),
            pendingQuotations: (pendingQuotations || []).map(q => {
                const qData = q as Record<string, unknown>;
                return {
                    id: q.id,
                    code: q.code,
                    client: 'Cliente',
                    service: getNestedName(qData.service) || 'Servicio',
                    brief: q.brief,
                    createdAt: q.created_at,
                };
            }),
        });
    } catch (error) {
        logger.error('Error in vendor stats:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
});
