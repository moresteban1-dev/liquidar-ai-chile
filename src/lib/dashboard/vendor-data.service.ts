/**
 * VendorDataService — Centralized data fetching for Vendor Dashboard V2.
 * Granular fetchers for Suspense streaming.
 */
'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClient, requireRole } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';

// ============================================
// Vendor Dashboard V2 Types
// ============================================

export interface VendorKpiV2 {
    label: string;
    value: string;
    numericValue: number;
    trend: number;
    trendLabel: string;
    accent: 'indigo' | 'emerald' | 'blue' | 'amber' | 'rose';
}

export interface VendorOpportunity {
    id: string;
    code: string;
    serviceName: string;
    brief: string;
    createdAt: string;
    hoursRemaining: number;
    isUrgent: boolean;
}

export interface VendorActiveOrder {
    id: string;
    code: string;
    serviceName: string;
    clientName: string;
    amount: number;
    status: string;
    eventDate: string | null;
}

// ============================================
// Fetchers
// ============================================

/**
 * Fetch Vendor V2 KPIs: earnings, active orders, open opportunities, rating.
 */
export async function getVendorKpisV2(): Promise<VendorKpiV2[]> {
    try {
        const authResult = await requireRole(UserRole.VENDOR);
        if (authResult.isFailure()) throw new Error(authResult.getError().message);
        const { user } = authResult.getValue();
        const supabase = createServiceRoleClient();

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [earningsResult, activeResult, openResult] = await Promise.all([
            supabase
                .from('quotations')
                .select('total_provider_net')
                .eq('assigned_provider_id', user.id)
                .in('status', ['PAID', 'FULFILLED'])
                .gte('paid_at', startOfMonth),
            supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_provider_id', user.id)
                .in('status', ['PENDING_ADMIN_APPROVAL', 'AWAITING_CLIENT_PAYMENT', 'APPROVED', 'PAID']),
            supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_provider_id', user.id)
                .eq('status', 'PENDING_PROVIDER_BID'),
        ]);

        const totalEarnings = earningsResult.data?.reduce(
            (sum, q) => sum + (q.total_provider_net || 0), 0
        ) ?? 0;

        const formatCompact = (n: number): string => {
            if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
            if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
            return `$${n}`;
        };

        return [
            {
                label: 'Ganancias del Mes',
                value: formatCompact(totalEarnings),
                numericValue: totalEarnings,
                trend: 0,
                trendLabel: 'este mes',
                accent: 'emerald',
            },
            {
                label: 'Pedidos en Curso',
                value: String(activeResult.count ?? 0),
                numericValue: activeResult.count ?? 0,
                trend: 0,
                trendLabel: 'activos',
                accent: 'blue',
            },
            {
                label: 'Oportunidades',
                value: String(openResult.count ?? 0),
                numericValue: openResult.count ?? 0,
                trend: 0,
                trendLabel: 'pendientes de respuesta',
                accent: 'amber',
            },
            {
                label: 'Calificación',
                value: '5.0',
                numericValue: 5.0,
                trend: 0,
                trendLabel: 'promedio general',
                accent: 'indigo',
            },
        ];
    } catch (error) {
        logger.error('[VendorDataService] Error fetching KPIs:', error);
        return [];
    }
}

/**
 * Fetch vendor's open opportunities with SLA timers.
 */
export async function getVendorOpportunities(): Promise<VendorOpportunity[]> {
    try {
        const authResult = await requireRole(UserRole.VENDOR);
        if (authResult.isFailure()) throw new Error(authResult.getError().message);
        const { user } = authResult.getValue();
        const supabase = createServiceRoleClient();

        const { data } = await supabase
            .from('quotations')
            .select(`
        id, code, brief, created_at,
        service:services(name)
      `)
            .eq('assigned_provider_id', user.id)
            .eq('status', 'PENDING_PROVIDER_BID')
            .order('created_at', { ascending: true })
            .limit(10);

        type DbRow = {
            id: string;
            code: string | null;
            brief: string;
            created_at: string;
            service: { name: string } | { name: string }[] | null;
        };

        const SLA_HOURS = 48; // 48-hour SLA for provider response

        return ((data as unknown as DbRow[]) ?? []).map(q => {
            const serviceName = Array.isArray(q.service) ? q.service[0]?.name : q.service?.name;
            const createdMs = new Date(q.created_at).getTime();
            const deadlineMs = createdMs + SLA_HOURS * 60 * 60 * 1000;
            const hoursRemaining = Math.max(0, Math.round((deadlineMs - Date.now()) / (1000 * 60 * 60)));

            return {
                id: q.id,
                code: q.code ?? q.id.slice(0, 8),
                serviceName: serviceName ?? 'Servicio General',
                brief: q.brief ?? '',
                createdAt: q.created_at,
                hoursRemaining,
                isUrgent: hoursRemaining <= 12,
            };
        });
    } catch (error) {
        logger.error('[VendorDataService] Error fetching opportunities:', error);
        return [];
    }
}

/**
 * Fetch vendor's active orders.
 */
export async function getVendorActiveOrders(): Promise<VendorActiveOrder[]> {
    try {
        const authResult = await requireRole(UserRole.VENDOR);
        if (authResult.isFailure()) throw new Error(authResult.getError().message);
        const { user } = authResult.getValue();
        const supabase = createServiceRoleClient();

        const { data } = await supabase
            .from('quotations')
            .select(`
        id, code, status, total_provider_net, event_start_date,
        
        service:services(name)
      `)
            .eq('assigned_provider_id', user.id)
            .in('status', ['PENDING_ADMIN_APPROVAL', 'AWAITING_CLIENT_PAYMENT', 'APPROVED', 'PAID'])
            .order('created_at', { ascending: false })
            .limit(10);

        type DbRow = {
            id: string;
            code: string | null;
            status: string;
            total_provider_net: number | null;
            event_start_date: string | null;
            
            service: { name: string } | { name: string }[] | null;
        };

        return ((data as unknown as DbRow[]) ?? []).map(q => {
            
            const serviceData = Array.isArray(q.service) ? q.service[0] : q.service;

            return {
                id: q.id,
                code: q.code ?? q.id.slice(0, 8),
                serviceName: serviceData?.name ?? 'Servicio',
                clientName: 'Confidencial',
                amount: q.total_provider_net ?? 0,
                status: q.status,
                eventDate: q.event_start_date,
            };
        });
    } catch (error) {
        logger.error('[VendorDataService] Error fetching active orders:', error);
        return [];
    }
}

// ─── Vendor Payment History ─────────────────────────────────────────────────

export interface VendorPaymentRecord {
    id: string;
    quotationCode: string;
    quotationId: string;
    serviceName: string;
    amount: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
}

/**
 * Fetch vendor's received payments.
 */
export async function getVendorPaymentHistory(): Promise<VendorPaymentRecord[]> {
    try {
        const authResult = await requireRole(UserRole.VENDOR);
        if (authResult.isFailure()) throw new Error(authResult.getError().message);
        const { user } = authResult.getValue();
        const supabase = createServiceRoleClient();

        // Get quotations where vendor was assigned and payment completed
        const { data } = await supabase
            .from('quotations')
            .select(`
                id, code, total_provider_net, status, paid_at, created_at,
                service:services(name)
            `)
            .eq('assigned_provider_id', user.id)
            .in('status', ['PAID', 'FULFILLED', 'COMPLETED'])
            .order('paid_at', { ascending: false, nullsFirst: false })
            .limit(20);

        type DbRow = {
            id: string;
            code: string | null;
            total_provider_net: number | null;
            status: string;
            paid_at: string | null;
            created_at: string;
            service: { name: string } | { name: string }[] | null;
        };

        return ((data as unknown as DbRow[]) ?? []).map(q => {
            const serviceName = Array.isArray(q.service) ? q.service[0]?.name : q.service?.name;
            return {
                id: q.id,
                quotationCode: q.code ?? q.id.slice(0, 8),
                quotationId: q.id,
                serviceName: serviceName ?? 'Servicio',
                amount: q.total_provider_net ?? 0,
                status: q.status,
                paidAt: q.paid_at,
                createdAt: q.created_at,
            };
        });
    } catch (error) {
        logger.error('[VendorDataService] Error fetching payment history:', error);
        return [];
    }
}

// ─── Vendor Feedback Received ───────────────────────────────────────────────

export interface VendorFeedback {
    id: string;
    quotationCode: string;
    overallRating: number;
    qualityRating: number | null;
    punctualityRating: number | null;
    communicationRating: number | null;
    comment: string | null;
    wouldRecommend: boolean;
    createdAt: string;
}

/**
 * Fetch feedback received from clients for vendor's completed events.
 */
export async function getVendorFeedbackReceived(): Promise<VendorFeedback[]> {
    try {
        const authResult = await requireRole(UserRole.VENDOR);
        if (authResult.isFailure()) throw new Error(authResult.getError().message);
        const { user } = authResult.getValue();
        const supabase = createServiceRoleClient();

        // Get quotation IDs where this vendor was assigned
        const { data: quotations } = await supabase
            .from('quotations')
            .select('id, code')
            .eq('assigned_provider_id', user.id)
            .in('status', ['PAID', 'FULFILLED', 'COMPLETED']);

        if (!quotations || quotations.length === 0) return [];

        const quotationIds = quotations.map(q => q.id);
        const codeMap = new Map<string, string>();
        for (const q of quotations) {
            codeMap.set(q.id, q.code ?? q.id.slice(0, 8));
        }

        // Fetch feedback for these quotations
        const { data: feedback } = await supabase
            .from('client_feedback')
            .select('*')
            .in('quotation_id', quotationIds)
            .order('created_at', { ascending: false })
            .limit(10);

        type FbRow = {
            id: string;
            quotation_id: string;
            overall_rating: number;
            quality_rating: number | null;
            punctuality_rating: number | null;
            communication_rating: number | null;
            comment: string | null;
            would_recommend: boolean;
            created_at: string;
        };

        return ((feedback as unknown as FbRow[]) ?? []).map(f => ({
            id: f.id,
            quotationCode: codeMap.get(f.quotation_id) ?? f.quotation_id.slice(0, 8),
            overallRating: f.overall_rating,
            qualityRating: f.quality_rating,
            punctualityRating: f.punctuality_rating,
            communicationRating: f.communication_rating,
            comment: f.comment,
            wouldRecommend: f.would_recommend,
            createdAt: f.created_at,
        }));
    } catch (error) {
        logger.error('[VendorDataService] Error fetching feedback:', error);
        return [];
    }
}

// ─── Vendor Performance Metrics ─────────────────────────────────────────────

export interface VendorPerformanceData {
    earningsByMonth: Array<{ name: string; earnings: number }>;
    conversionRate: number;
    totalCompleted: number;
    totalAssigned: number;
    averageRating: number;
}

/**
 * Fetch vendor's performance metrics: monthly earnings, conversion, rating.
 */
export async function getVendorPerformanceMetrics(): Promise<VendorPerformanceData> {
    try {
        const authResult = await requireRole(UserRole.VENDOR);
        if (authResult.isFailure()) throw new Error(authResult.getError().message);
        const { user } = authResult.getValue();
        const supabase = createServiceRoleClient();

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const now = new Date();

        // Parallel: all vendor quotations + feedback
        const [allQuotationsResult, completedResult, feedbackResult] = await Promise.all([
            supabase
                .from('quotations')
                .select('total_provider_net, status, paid_at')
                .eq('assigned_provider_id', user.id),
            supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_provider_id', user.id)
                .in('status', ['PAID', 'FULFILLED', 'COMPLETED']),
            supabase
                .from('client_feedback')
                .select('overall_rating, quotation_id')
                .in('quotation_id',
                    (await supabase
                        .from('quotations')
                        .select('id')
                        .eq('assigned_provider_id', user.id)
                        .in('status', ['PAID', 'FULFILLED', 'COMPLETED'])
                    ).data?.map(q => q.id) ?? []
                ),
        ]);

        const allQuotations = allQuotationsResult.data ?? [];
        const totalAssigned = allQuotations.length;
        const totalCompleted = completedResult.count ?? 0;
        const conversionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

        // Earnings by month (last 6)
        const paidQuotations = allQuotations.filter(q =>
            ['PAID', 'FULFILLED', 'COMPLETED'].includes(q.status) && q.paid_at
        );

        const earningsByMonth: Array<{ name: string; earnings: number }> = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const monthEarnings = paidQuotations
                .filter(q => {
                    const d = new Date(q.paid_at);
                    return d >= monthStart && d <= monthEnd;
                })
                .reduce((sum, q) => sum + (q.total_provider_net || 0), 0);

            earningsByMonth.push({ name: monthNames[monthStart.getMonth()] || 'Mes', earnings: monthEarnings });
        }

        // Average rating
        const ratings = feedbackResult.data ?? [];
        const averageRating = ratings.length > 0
            ? Math.round((ratings.reduce((sum, f) => sum + f.overall_rating, 0) / ratings.length) * 10) / 10
            : 5.0;

        return { earningsByMonth, conversionRate, totalCompleted, totalAssigned, averageRating };
    } catch (error) {
        logger.error('[VendorDataService] Error fetching performance metrics:', error);
        return { earningsByMonth: [], conversionRate: 0, totalCompleted: 0, totalAssigned: 0, averageRating: 5.0 };
    }
}
