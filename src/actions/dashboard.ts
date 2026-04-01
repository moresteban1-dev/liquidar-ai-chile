'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClient, requireRole } from '@/lib/supabase/api';
import { QuotationPublicStatus } from '@/lib/types';
import { UserRole } from '@/core/domain/auth/UserRole';

// --- Types ---

export type KpiData = {
    value: number | string;
    trend: number;
    spark: number[];
};

export type DashboardOrder = {
    id: string;
    client: string;
    amount: number;
    status: QuotationPublicStatus; // Strict type
    date: string;
};

export type DashboardQuote = {
    id: string;
    code: string;
    publicStatus: QuotationPublicStatus; // Strict type matching StatusBadge
    createdAt: string;
    priceTotal: number;
    brief: string;
    service: {
        name: string;
        imageUrl: string | null;
    };
    client?: string; // Vendor specific (Confidential or Real)
    budget?: number; // Vendor specific
    deadline?: string; // Vendor specific
};

export type AdminDashboardData = {
    kpis: {
        revenue: KpiData;
        margin: KpiData;
        orders: KpiData;
        quotes: KpiData;
    };
    recentOrders: DashboardOrder[];
};

export type ClientDashboardData = {
    kpis: {
        activeQuotes: KpiData;
        activeOrders: KpiData;
        totalSpent: KpiData;
    };
    recentQuotes: DashboardQuote[];
};

export type VendorDashboardData = {
    kpis: {
        earnings: KpiData;
        activeOrders: KpiData;
        openQuotes: KpiData;
        rating: KpiData;
    };
    pendingQuotes: DashboardQuote[];
};

// --- Admin ---

// --- Admin Granular Fetchers (for Suspense) ---

export async function getAdminKPIs(): Promise<AdminDashboardData['kpis']> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();
        // Bypass RPC cache temporarily
        const { data: kpiData, error: kpiError } = await supabase.rpc('get_admin_kpis');

        if (kpiError) throw kpiError;

        const kpis = kpiData as { revenue: number; margin: number; orders: number; quotes: number };

        return {
            revenue: { value: kpis.revenue || 0, trend: 0, spark: [] },
            margin: { value: kpis.margin || 0, trend: 0, spark: [] },
            orders: { value: kpis.orders || 0, trend: 0, spark: [] },
            quotes: { value: kpis.quotes || 0, trend: 0, spark: [] },
        };
    } catch (error) {
        logger.error('Error fetching admin KPIs:', error);
        return {
            revenue: { value: 0, trend: 0, spark: [] },
            margin: { value: 0, trend: 0, spark: [] },
            orders: { value: 0, trend: 0, spark: [] },
            quotes: { value: 0, trend: 0, spark: [] },
        };
    }
}

export async function getAdminRecentOrders(): Promise<DashboardOrder[]> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();

        const { data: recentOrders } = await supabase
            .from('quotations')
            .select(`
                id, 
                code, 
                created_at, 
                total_client_price, 
                public_status, 
                client:profiles!quotations_client_id_fkey(name, email)
            `)
            .in('status', ['AWAITING_CLIENT_PAYMENT', 'APPROVED', 'PAID', 'FULFILLED'])
            .order('created_at', { ascending: false })
            .limit(5);

        type DbAdminOrderResult = {
            id: string;
            code: string | null;
            created_at: string;
            total_client_price: number | null;
            public_status: string;
            client: { name: string; email: string } | { name: string; email: string }[] | null;
        };

        return (recentOrders as unknown as DbAdminOrderResult[])?.map(o => {
            const clientData = Array.isArray(o.client) ? o.client[0] : o.client;
            const clientName = clientData?.name || clientData?.email || 'Cliente Desconocido';

            return {
                id: o.code || o.id.slice(0, 8),
                client: clientName,
                amount: o.total_client_price || 0,
                status: o.public_status as QuotationPublicStatus,
                date: new Date(o.created_at).toLocaleDateString('es-CL'),
            };
        }) || [];

    } catch (error) {
        logger.error('Error fetching admin recent orders:', error);
        return [];
    }
}


// getAdminDashboardData() removed — replaced by getAdminKPIs() + getAdminRecentOrders() with Suspense

// --- Client ---

import { createCachedQuery } from '@/lib/cache';

// --- Client Granular Fetchers (Cached) ---

const fetchClientKPIs = async (userId: string): Promise<ClientDashboardData['kpis']> => {
    try {
        const supabase = createServiceRoleClient();

        const [activeQuotesResult, activeOrdersResult, spentResult] = await Promise.all([
            supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .eq('client_id', userId)
                .in('status', ['PENDING_ASSIGNMENT', 'PENDING_PROVIDER_BID', 'PENDING_ADMIN_APPROVAL', 'AWAITING_CLIENT_PAYMENT']),
            supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .eq('client_id', userId)
                .in('status', ['APPROVED', 'PAID']),
            supabase
                .from('quotations')
                .select('total_client_price')
                .eq('client_id', userId)
                .in('status', ['PAID', 'FULFILLED'])
        ]);

        const totalSpent = spentResult.data?.reduce((sum, q) => sum + (q.total_client_price || 0), 0) || 0;

        return {
            activeQuotes: { value: activeQuotesResult.count || 0, trend: 0, spark: [] },
            activeOrders: { value: activeOrdersResult.count || 0, trend: 0, spark: [] },
            totalSpent: { value: totalSpent, trend: 0, spark: [] },
        };
    } catch (error) {
        logger.error('Error fetching Client KPIs:', error);
        return {
            activeQuotes: { value: 0, trend: 0, spark: [] },
            activeOrders: { value: 0, trend: 0, spark: [] },
            totalSpent: { value: 0, trend: 0, spark: [] },
        };
    }
};

export const getCachedClientKPIs = createCachedQuery(fetchClientKPIs, {
    keyPrefix: 'client-kpis',
    revalidate: 60, // 1 minute
    tags: ['dashboard', 'quotations']
});

const fetchClientRecentQuotes = async (userId: string): Promise<DashboardQuote[]> => {
    try {
        const supabase = createServiceRoleClient();

        const { data: recentData } = await supabase
            .from('quotations')
            .select(`
            id, 
            code, 
            public_status, 
            created_at, 
            price_total:total_client_price,
            brief,
            service:services(name)
        `)
            .eq('client_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        type DbQuotationResult = {
            id: string;
            code: string | null;
            public_status: string;
            created_at: string;
            price_total?: number;
            brief: string;
            service: { name: string } | { name: string }[] | null;
        };

        return (recentData as unknown as DbQuotationResult[])?.map(q => {
            const serviceName = Array.isArray(q.service) ? q.service[0]?.name : q.service?.name;
            return {
                id: q.id,
                code: q.code || '',
                publicStatus: q.public_status as QuotationPublicStatus,
                createdAt: q.created_at,
                priceTotal: q.price_total || 0,
                brief: q.brief,
                service: {
                    name: serviceName || 'Servicio General',
                    imageUrl: null
                }
            };
        }) || [];
    } catch (error) {
        logger.error('Error fetching Client Recent Quotes:', error);
        return [];
    }
};

export const getCachedClientRecentQuotes = createCachedQuery(fetchClientRecentQuotes, {
    keyPrefix: 'client-recent-quotes',
    revalidate: 30, // 30 seconds
    tags: ['dashboard', 'quotations']
});

// getClientDashboardData() removed — replaced by getCachedClientKPIs() + getCachedClientRecentQuotes() with Suspense

// --- Vendor ---

// getVendorDashboardData() removed — replaced by vendor-data.service.ts granular fetchers with Suspense
