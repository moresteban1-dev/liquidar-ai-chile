/**
 * AdminDataService — Centralized data fetching layer for Admin Dashboard V2.
 * Uses parallel queries with Promise.all for optimal performance.
 * All methods use service role client to bypass RLS (admin-only context).
 */
'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClient, requireRole } from '@/lib/supabase/api';
import type { QuotationInternalStatus } from '@/lib/types';
import { UserRole } from '@/core/domain/auth/UserRole';

// ============================================
// Admin Dashboard V2 Types
// ============================================

export interface AdminKpiV2 {
    label: string;
    value: string;
    numericValue: number;
    trend: number;
    trendLabel: string;
    accent: 'indigo' | 'emerald' | 'blue' | 'amber' | 'rose';
}

export interface PipelineStage {
    id: string;
    label: string;
    count: number;
    statuses: QuotationInternalStatus[];
    color: string;
}

export interface PipelineQuotation {
    id: string;
    code: string;
    clientName: string;
    serviceName: string;
    totalAmount: number;
    createdAt: string;
    status: string;
    daysInStage: number;
}

export interface RevenueDataPoint {
    month: string;
    revenue: number;
    margin: number;
}

export interface CatalogStatsData {
    totalItems: number;
    activeItems: number;
    categoriesCount: number;
    utilizationRate: number;
}

export interface RecentQuotationRow {
    id: string;
    code: string;
    clientName: string;
    clientEmail: string;
    serviceName: string;
    amount: number;
    status: string;
    publicStatus: string;
    createdAt: string;
    eventDate: string | null;
}

export interface ProviderActivityRow {
    id: string;
    name: string;
    email: string;
    activeQuotes: number;
    completedOrders: number;
    rating: number;
    lastActiveAt: string | null;
}

// ============================================
// Fetchers — Granular for Suspense Streaming
// ============================================

const PIPELINE_STAGES: PipelineStage[] = [
    { id: 'pending_assignment', label: 'Sin Asignar', count: 0, statuses: ['PENDING_ASSIGNMENT'] as QuotationInternalStatus[], color: 'amber' },
    { id: 'pending_bid', label: 'Esperando Proveedor', count: 0, statuses: ['PENDING_PROVIDER_BID'] as QuotationInternalStatus[], color: 'blue' },
    { id: 'pending_approval', label: 'Revisión Admin', count: 0, statuses: ['PENDING_ADMIN_APPROVAL'] as QuotationInternalStatus[], color: 'indigo' },
    { id: 'awaiting_payment', label: 'Esperando Pago', count: 0, statuses: ['AWAITING_CLIENT_PAYMENT'] as QuotationInternalStatus[], color: 'emerald' },
    { id: 'completed', label: 'Completadas', count: 0, statuses: ['APPROVED', 'PAID', 'FULFILLED'] as QuotationInternalStatus[], color: 'green' },
];

/**
 * Fetch KPIs V2 with month-over-month trends.
 * Queries: revenue, margin, active_quotes, conversion_rate.
 */
export async function getAdminKpisV2(): Promise<AdminKpiV2[]> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

        const [
            currentRevenueResult,
            prevRevenueResult,
            activeQuotesResult,
            completedResult,
            totalQuotesResult,
        ] = await Promise.all([
            // Current month revenue
            supabase
                .from('quotations')
                .select('total_client_price, total_provider_net')
                .in('status', ['PAID', 'FULFILLED'])
                .gte('paid_at', startOfMonth),
            // Previous month revenue
            supabase
                .from('quotations')
                .select('total_client_price, total_provider_net')
                .in('status', ['PAID', 'FULFILLED'])
                .gte('paid_at', startOfPrevMonth)
                .lte('paid_at', endOfPrevMonth),
            // Active quotes count
            supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .in('status', ['PENDING_ASSIGNMENT', 'PENDING_PROVIDER_BID', 'PENDING_ADMIN_APPROVAL', 'AWAITING_CLIENT_PAYMENT']),
            // Completed this month
            supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .in('status', ['PAID', 'FULFILLED'])
                .gte('paid_at', startOfMonth),
            // Total quotes this month
            supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth),
        ]);

        const currentRevenue = currentRevenueResult.data?.reduce((sum, q) => sum + (q.total_client_price || 0), 0) ?? 0;
        const prevRevenue = prevRevenueResult.data?.reduce((sum, q) => sum + (q.total_client_price || 0), 0) ?? 0;
        const currentMargin = currentRevenueResult.data?.reduce((sum, q) =>
            sum + ((q.total_client_price || 0) - (q.total_provider_net || 0)), 0) ?? 0;
        const prevMargin = prevRevenueResult.data?.reduce((sum, q) =>
            sum + ((q.total_client_price || 0) - (q.total_provider_net || 0)), 0) ?? 0;

        const calcTrend = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const completed = completedResult.count ?? 0;
        const totalQuotes = totalQuotesResult.count ?? 0;
        const conversionRate = totalQuotes > 0 ? Math.round((completed / totalQuotes) * 100) : 0;

        const formatCompact = (n: number): string => {
            if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
            if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
            return `$${n}`;
        };

        return [
            {
                label: 'Ingresos del Mes',
                value: formatCompact(currentRevenue),
                numericValue: currentRevenue,
                trend: calcTrend(currentRevenue, prevRevenue),
                trendLabel: 'vs mes anterior',
                accent: 'indigo',
            },
            {
                label: 'Margen Neto',
                value: formatCompact(currentMargin),
                numericValue: currentMargin,
                trend: calcTrend(currentMargin, prevMargin),
                trendLabel: 'vs mes anterior',
                accent: 'emerald',
            },
            {
                label: 'Cotizaciones Activas',
                value: String(activeQuotesResult.count ?? 0),
                numericValue: activeQuotesResult.count ?? 0,
                trend: 0,
                trendLabel: 'en pipeline',
                accent: 'blue',
            },
            {
                label: 'Tasa de Conversión',
                value: `${conversionRate}%`,
                numericValue: conversionRate,
                trend: 0,
                trendLabel: `${completed}/${totalQuotes} este mes`,
                accent: 'amber',
            },
        ];
    } catch (error) {
        logger.error('[AdminDataService] Error fetching KPIs V2:', error);
        return [];
    }
}

/**
 * Fetch pipeline data — counts per stage + top quotations per stage.
 */
export async function getAdminPipeline(): Promise<{ stages: PipelineStage[]; quotations: PipelineQuotation[] }> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();

        const allStatuses = PIPELINE_STAGES.flatMap(s => s.statuses);

        const { data: quotations } = await supabase
            .from('quotations')
            .select(`
        id, code, status, created_at, total_client_price,
        client:profiles!quotations_client_id_fkey(name, email),
        service:services(name)
      `)
            .in('status', allStatuses)
            .order('created_at', { ascending: false })
            .limit(50);

        type DbPipelineRow = {
            id: string;
            code: string | null;
            status: string;
            created_at: string;
            total_client_price: number | null;
            client: { name: string; email: string } | { name: string; email: string }[] | null;
            service: { name: string } | { name: string }[] | null;
        };

        const rows = (quotations as unknown as DbPipelineRow[]) ?? [];

        // Count per stage
        const stages = PIPELINE_STAGES.map(stage => ({
            ...stage,
            count: rows.filter(q => (stage.statuses as string[]).includes(q.status)).length,
        }));

        // Map quotations
        const mapped: PipelineQuotation[] = rows.map(q => {
            const clientData = Array.isArray(q.client) ? q.client[0] : q.client;
            const serviceData = Array.isArray(q.service) ? q.service[0] : q.service;
            const daysSince = Math.floor((Date.now() - new Date(q.created_at).getTime()) / (1000 * 60 * 60 * 24));

            return {
                id: q.id,
                code: q.code ?? q.id.slice(0, 8),
                clientName: clientData?.name ?? clientData?.email ?? 'Cliente',
                serviceName: serviceData?.name ?? 'Servicio General',
                totalAmount: q.total_client_price ?? 0,
                createdAt: q.created_at,
                status: q.status,
                daysInStage: daysSince,
            };
        });

        return { stages, quotations: mapped };
    } catch (error) {
        logger.error('[AdminDataService] Error fetching pipeline:', error);
        return { stages: PIPELINE_STAGES, quotations: [] };
    }
}

/**
 * Fetch monthly revenue data for chart (last 6 months).
 */
export async function getAdminRevenueChart(): Promise<RevenueDataPoint[]> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const now = new Date();
        const result: RevenueDataPoint[] = [];

        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const { data } = await supabase
                .from('quotations')
                .select('total_client_price, total_provider_net')
                .in('status', ['PAID', 'FULFILLED'])
                .gte('paid_at', monthStart.toISOString())
                .lte('paid_at', monthEnd.toISOString());

            const revenue = data?.reduce((sum, q) => sum + (q.total_client_price || 0), 0) ?? 0;
            const margin = data?.reduce((sum, q) => sum + ((q.total_client_price || 0) - (q.total_provider_net || 0)), 0) ?? 0;

            result.push({
                month: monthNames[monthStart.getMonth()] || 'Mes',
                revenue,
                margin,
            });
        }

        return result;
    } catch (error) {
        logger.error('[AdminDataService] Error fetching revenue chart:', error);
        return [];
    }
}

/**
 * Fetch catalog V2 stats (items, categories, utilization).
 */
export async function getAdminCatalogStats(): Promise<CatalogStatsData> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();

        const [itemsResult, activeItemsResult, categoriesResult] = await Promise.all([
            supabase.from('catalog_items').select('*', { count: 'exact', head: true }),
            supabase.from('catalog_items').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
            supabase.from('catalog_categories').select('*', { count: 'exact', head: true }),
        ]);

        const total = itemsResult.count ?? 0;
        const active = activeItemsResult.count ?? 0;
        const utilization = total > 0 ? Math.round((active / total) * 100) : 0;

        return {
            totalItems: total,
            activeItems: active,
            categoriesCount: categoriesResult.count ?? 0,
            utilizationRate: utilization,
        };
    } catch (error) {
        logger.error('[AdminDataService] Error fetching catalog stats:', error);
        return { totalItems: 0, activeItems: 0, categoriesCount: 0, utilizationRate: 0 };
    }
}

/**
 * Fetch recent quotations with client and service data (paginated).
 */
export async function getAdminRecentQuotationsV2(limit = 10): Promise<RecentQuotationRow[]> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();

        const { data } = await supabase
            .from('quotations')
            .select(`
        id, code, status, public_status, created_at, total_client_price, event_start_date,
        client:profiles!quotations_client_id_fkey(name, email),
        service:services(name)
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        type DbRecentRow = {
            id: string;
            code: string | null;
            status: string;
            public_status: string;
            created_at: string;
            total_client_price: number | null;
            event_start_date: string | null;
            client: { name: string; email: string } | { name: string; email: string }[] | null;
            service: { name: string } | { name: string }[] | null;
        };

        return ((data as unknown as DbRecentRow[]) ?? []).map(q => {
            const clientData = Array.isArray(q.client) ? q.client[0] : q.client;
            const serviceData = Array.isArray(q.service) ? q.service[0] : q.service;

            return {
                id: q.id,
                code: q.code ?? q.id.slice(0, 8),
                clientName: clientData?.name ?? 'Cliente',
                clientEmail: clientData?.email ?? '',
                serviceName: serviceData?.name ?? 'Servicio General',
                amount: q.total_client_price ?? 0,
                status: q.status,
                publicStatus: q.public_status,
                createdAt: q.created_at,
                eventDate: q.event_start_date,
            };
        });
    } catch (error) {
        logger.error('[AdminDataService] Error fetching recent quotations:', error);
        return [];
    }
}

/**
 * Fetch provider activity summary.
 */
export async function getAdminProviderActivity(limit = 5): Promise<ProviderActivityRow[]> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();

        const { data: providers } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('role', UserRole.VENDOR)
            .limit(limit);

        if (!providers?.length) return [];

        const providerIds = providers.map(p => p.id);

        const [activeResult, completedResult] = await Promise.all([
            supabase
                .from('quotations')
                .select('assigned_provider_id')
                .in('assigned_provider_id', providerIds)
                .in('status', ['PENDING_PROVIDER_BID', 'PENDING_ADMIN_APPROVAL']),
            supabase
                .from('quotations')
                .select('assigned_provider_id')
                .in('assigned_provider_id', providerIds)
                .in('status', ['PAID', 'FULFILLED']),
        ]);

        return providers.map(p => ({
            id: p.id,
            name: p.name ?? 'Proveedor',
            email: p.email,
            activeQuotes: activeResult.data?.filter(q => q.assigned_provider_id === p.id).length ?? 0,
            completedOrders: completedResult.data?.filter(q => q.assigned_provider_id === p.id).length ?? 0,
            rating: 5.0,
            lastActiveAt: null,
        }));
    } catch (error) {
        logger.error('[AdminDataService] Error fetching provider activity:', error);
        return [];
    }
}

// ============================================
// Analytics & Finance — Fetchers for RSC Migration
// ============================================

export interface AnalyticsServerData {
    metrics: {
        totalOrders: number;
        totalRevenue: number;
        activeOrders: number;
        pendingOrders: number;
    };
    charts: {
        revenue: { name: string; revenue: number }[];
        status: { name: string; value: number }[];
    };
}

/**
 * Server-side fetcher for Analytics page (replaces /api/admin/stats/analytics).
 */
export async function getAdminAnalyticsData(): Promise<AnalyticsServerData> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const now = new Date();

        // Parallel: order counts + revenue by month + status distribution
        const [
            totalResult,
            activeResult,
            pendingResult,
            revenueResult,
            statusResult,
        ] = await Promise.all([
            supabase.from('orders').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS'),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
            supabase
                .from('quotations')
                .select('total_client_price, paid_at')
                .in('status', ['PAID', 'FULFILLED'])
                .not('paid_at', 'is', null),
            supabase
                .from('orders')
                .select('status'),
        ]);

        const totalRevenue = revenueResult.data?.reduce((sum, q) => sum + (q.total_client_price || 0), 0) ?? 0;

        // Revenue by month (last 6)
        const revenueByMonth: { name: string; revenue: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const monthRevenue = revenueResult.data
                ?.filter(q => {
                    const paidAt = new Date(q.paid_at);
                    return paidAt >= monthStart && paidAt <= monthEnd;
                })
                .reduce((sum, q) => sum + (q.total_client_price || 0), 0) ?? 0;

            revenueByMonth.push({ name: monthNames[monthStart.getMonth()] || 'Mes', revenue: monthRevenue });
        }

        // Status distribution
        const statusCounts: Record<string, number> = {};
        for (const order of statusResult.data ?? []) {
            const label = order.status === 'IN_PROGRESS' ? 'En Proceso'
                : order.status === 'COMPLETED' ? 'Completadas'
                    : order.status === 'PENDING' ? 'Pendientes'
                        : order.status === 'CANCELLED' ? 'Canceladas'
                            : order.status;
            statusCounts[label] = (statusCounts[label] || 0) + 1;
        }
        const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

        return {
            metrics: {
                totalOrders: totalResult.count ?? 0,
                totalRevenue,
                activeOrders: activeResult.count ?? 0,
                pendingOrders: pendingResult.count ?? 0,
            },
            charts: {
                revenue: revenueByMonth,
                status: statusDistribution.length > 0 ? statusDistribution : [{ name: 'Sin datos', value: 0 }],
            },
        };
    } catch (error) {
        logger.error('[AdminDataService] Error fetching analytics data:', error);
        return {
            metrics: { totalOrders: 0, totalRevenue: 0, activeOrders: 0, pendingOrders: 0 },
            charts: { revenue: [], status: [{ name: 'Sin datos', value: 0 }] },
        };
    }
}

export interface FinanceServerData {
    totals: {
        revenue: number;
        cost: number;
        margin: number;
        count: number;
    };
    chartData: Array<{ name: string; revenue: number; cost: number; margin: number }>;
    recentTransactions: Array<{
        id: string;
        date: string;
        amount: number;
        status: string;
    }>;
}

/**
 * Server-side fetcher for Finance page (replaces /api/admin/stats/finance).
 */
export async function getAdminFinanceData(): Promise<FinanceServerData> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const now = new Date();

        // Fetch all paid quotations in parallel with recent orders
        const [quotationsResult, recentOrdersResult] = await Promise.all([
            supabase
                .from('quotations')
                .select('total_client_price, total_provider_net, paid_at')
                .in('status', ['PAID', 'FULFILLED'])
                .not('paid_at', 'is', null),
            supabase
                .from('orders')
                .select('id, created_at, total_amount, status')
                .order('created_at', { ascending: false })
                .limit(10),
        ]);

        const quotations = quotationsResult.data ?? [];

        const totalRevenue = quotations.reduce((sum, q) => sum + (q.total_client_price || 0), 0);
        const totalCost = quotations.reduce((sum, q) => sum + (q.total_provider_net || 0), 0);
        const totalMargin = totalRevenue - totalCost;

        // Chart data by month
        const chartData: Array<{ name: string; revenue: number; cost: number; margin: number }> = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const monthQuotations = quotations.filter(q => {
                const paidAt = new Date(q.paid_at);
                return paidAt >= monthStart && paidAt <= monthEnd;
            });

            const revenue = monthQuotations.reduce((sum, q) => sum + (q.total_client_price || 0), 0);
            const cost = monthQuotations.reduce((sum, q) => sum + (q.total_provider_net || 0), 0);

            chartData.push({
                name: monthNames[monthStart.getMonth()] || 'Mes',
                revenue,
                cost,
                margin: revenue - cost,
            });
        }

        const statusLabel = (s: string) =>
            s === 'COMPLETED' ? 'DELIVERED'
                : s === 'IN_PROGRESS' ? 'EN PROCESO'
                    : s === 'PENDING' ? 'PENDIENTE'
                        : s.replace(/_/g, ' ');

        return {
            totals: {
                revenue: totalRevenue,
                cost: totalCost,
                margin: totalMargin,
                count: quotations.length,
            },
            chartData,
            recentTransactions: (recentOrdersResult.data ?? []).map(order => ({
                id: order.id,
                date: order.created_at,
                amount: order.total_amount ?? 0,
                status: statusLabel(order.status),
            })),
        };
    } catch (error) {
        logger.error('[AdminDataService] Error fetching finance data:', error);
        return {
            totals: { revenue: 0, cost: 0, margin: 0, count: 0 },
            chartData: [],
            recentTransactions: [],
        };
    }
}

// ============================================
// Admin Payment Management — Fetcher
// ============================================

export interface AdminPaymentRow {
    id: string;
    orderId: string;
    clientName: string;
    clientEmail: string;
    gatewaySlug: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    paidAt: string | null;
    receiptUrl: string | null;
}

/**
 * Fetch all payments for the admin management panel.
 */
export async function getAdminPaymentsList(limit = 25): Promise<AdminPaymentRow[]> {
    try {
        await requireRole(UserRole.ADMIN);
        const supabase = createServiceRoleClient();

        const { data } = await supabase
            .from('payments')
            .select(`
                id, order_id, gateway_slug, amount, currency, status, created_at, paid_at, metadata,
                user:profiles!payments_user_id_fkey(name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        type DbPaymentRow = {
            id: string;
            order_id: string;
            gateway_slug: string;
            amount: number;
            currency: string;
            status: string;
            created_at: string;
            paid_at: string | null;
            metadata: Record<string, unknown> | null;
            user: { name: string; email: string } | { name: string; email: string }[] | null;
        };

        return ((data as unknown as DbPaymentRow[]) ?? []).map(p => {
            const userData = Array.isArray(p.user) ? p.user[0] : p.user;
            return {
                id: p.id,
                orderId: p.order_id,
                clientName: userData?.name ?? 'Cliente',
                clientEmail: userData?.email ?? '',
                gatewaySlug: p.gateway_slug,
                amount: p.amount,
                currency: p.currency,
                status: p.status,
                createdAt: p.created_at,
                paidAt: p.paid_at,
                receiptUrl: (p.metadata?.transfer_receipt_url as string) ?? null,
            };
        });
    } catch (error) {
        logger.error('[AdminDataService] Error fetching payments list:', error);
        return [];
    }
}

