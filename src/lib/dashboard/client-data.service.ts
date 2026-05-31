/**
 * ClientDataService — Centralized data fetching for Client Dashboard V2.
 * Granular fetchers for Suspense streaming.
 */
'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClient } from '@/lib/supabase/api';

// ============================================
// Client Dashboard V2 Types
// ============================================

export interface ClientKpiV2 {
    label: string;
    value: string;
    numericValue: number;
    trend: number;
    trendLabel: string;
    accent: 'indigo' | 'emerald' | 'blue' | 'amber' | 'rose';
}

export interface UpcomingEvent {
    id: string;
    code: string;
    serviceName: string;
    eventDate: string;
    daysUntil: number;
    status: string;
    publicStatus: string;
    amount: number;
}

export interface ClientQuotation {
    id: string;
    code: string;
    serviceName: string;
    publicStatus: string;
    amount: number;
    createdAt: string;
    requiresAction: boolean;
    technicalVisitSuggested: boolean;
}

// ============================================
// Fetchers
// ============================================

/**
 * Fetch Client V2 KPIs.
 */
export async function getClientKpisV2(userId: string): Promise<ClientKpiV2[]> {
    try {
        const supabase = createServiceRoleClient();

        const [activeQuotesResult, activeOrdersResult, spentResult, upcomingResult] = await Promise.all([
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
                .in('status', ['PAID', 'FULFILLED']),
            supabase
                .from('quotations')
                .select('*', { count: 'exact', head: true })
                .eq('client_id', userId)
                .gte('event_start_date', new Date().toISOString())
                .in('status', ['APPROVED', 'PAID', 'AWAITING_CLIENT_PAYMENT']),
        ]);

        const totalSpent = spentResult.data?.reduce((sum, q) => sum + (q.total_client_price || 0), 0) ?? 0;

        const formatCompact = (n: number): string => {
            if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
            if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
            return `$${n}`;
        };

        return [
            {
                label: 'Cotizaciones Activas',
                value: String(activeQuotesResult.count ?? 0),
                numericValue: activeQuotesResult.count ?? 0,
                trend: 0,
                trendLabel: 'en proceso',
                accent: 'blue',
            },
            {
                label: 'Pedidos Confirmados',
                value: String(activeOrdersResult.count ?? 0),
                numericValue: activeOrdersResult.count ?? 0,
                trend: 0,
                trendLabel: 'en curso',
                accent: 'emerald',
            },
            {
                label: 'Total Invertido',
                value: formatCompact(totalSpent),
                numericValue: totalSpent,
                trend: 0,
                trendLabel: 'acumulado',
                accent: 'indigo',
            },
            {
                label: 'Próximos Eventos',
                value: String(upcomingResult.count ?? 0),
                numericValue: upcomingResult.count ?? 0,
                trend: 0,
                trendLabel: 'programados',
                accent: 'amber',
            },
        ];
    } catch (error) {
        logger.error('[ClientDataService] Error fetching KPIs:', error);
        return [];
    }
}

/**
 * Fetch client's upcoming events with countdown.
 */
export async function getClientUpcomingEvents(userId: string): Promise<UpcomingEvent[]> {
    try {
        const supabase = createServiceRoleClient();

        const { data } = await supabase
            .from('quotations')
            .select(`
        id, code, status, public_status, total_client_price, event_start_date,
        service:services(name)
      `)
            .eq('client_id', userId)
            .gte('event_start_date', new Date().toISOString())
            .in('status', ['AWAITING_CLIENT_PAYMENT', 'APPROVED', 'PAID'])
            .order('event_start_date', { ascending: true })
            .limit(5);

        type DbRow = {
            id: string;
            code: string | null;
            status: string;
            public_status: string;
            total_client_price: number | null;
            event_start_date: string | null;
            service: { name: string } | { name: string }[] | null;
        };

        return ((data as unknown as DbRow[]) ?? []).map(q => {
            const serviceName = Array.isArray(q.service) ? q.service[0]?.name : q.service?.name;
            const eventDateMs = q.event_start_date ? new Date(q.event_start_date).getTime() : Date.now();
            const daysUntil = Math.max(0, Math.ceil((eventDateMs - Date.now()) / (1000 * 60 * 60 * 24)));

            return {
                id: q.id,
                code: q.code ?? q.id.slice(0, 8),
                serviceName: serviceName ?? 'Evento',
                eventDate: q.event_start_date ?? '',
                daysUntil,
                status: q.status,
                publicStatus: q.public_status,
                amount: q.total_client_price ?? 0,
            };
        });
    } catch (error) {
        logger.error('[ClientDataService] Error fetching upcoming events:', error);
        return [];
    }
}

/**
 * Fetch client's active quotations requiring attention.
 */
export async function getClientActiveQuotations(userId: string): Promise<ClientQuotation[]> {
    try {
        const supabase = createServiceRoleClient();

        const { data } = await supabase
            .from('quotations')
            .select(`
        id, code, public_status, total_client_price, created_at, status,
        provider_suggests_technical_visit,
        service:services(name)
      `)
            .eq('client_id', userId)
            .in('status', ['PENDING_ASSIGNMENT', 'PENDING_PROVIDER_BID', 'PENDING_ADMIN_APPROVAL', 'AWAITING_CLIENT_PAYMENT'])
            .order('created_at', { ascending: false })
            .limit(10);

        type DbRow = {
            id: string;
            code: string | null;
            public_status: string;
            total_client_price: number | null;
            created_at: string;
            status: string;
            provider_suggests_technical_visit: boolean | null;
            service: { name: string } | { name: string }[] | null;
        };

        return ((data as unknown as DbRow[]) ?? []).map(q => {
            const serviceName = Array.isArray(q.service) ? q.service[0]?.name : q.service?.name;

            return {
                id: q.id,
                code: q.code ?? q.id.slice(0, 8),
                serviceName: serviceName ?? 'Servicio',
                publicStatus: q.public_status,
                amount: q.total_client_price ?? 0,
                createdAt: q.created_at,
                requiresAction: q.status === 'AWAITING_CLIENT_PAYMENT',
                technicalVisitSuggested: !!q.provider_suggests_technical_visit,
            };
        });
    } catch (error) {
        logger.error('[ClientDataService] Error fetching active quotations:', error);
        return [];
    }
}

// ─── Completed Events (for Re-quotation) ────────────────────────────────────

export interface CompletedEvent {
    id: string;
    code: string;
    serviceName: string;
    eventDate: string;
    attendees: number;
    amount: number;
}

/**
 * Fetch client's completed events for re-quotation CTA.
 */
export async function getClientCompletedEvents(userId: string): Promise<CompletedEvent[]> {
    try {
        const supabase = createServiceRoleClient();

        const { data } = await supabase
            .from('quotations')
            .select(`
                id, code, event_start_date, attendees, total_client_price,
                service:services(name)
            `)
            .eq('client_id', userId)
            .in('status', ['COMPLETED', 'FULFILLED', 'PAID'])
            .order('event_start_date', { ascending: false })
            .limit(5);

        type DbRow = {
            id: string;
            code: string | null;
            event_start_date: string | null;
            attendees: number | null;
            total_client_price: number | null;
            service: { name: string } | { name: string }[] | null;
        };

        return ((data as unknown as DbRow[]) ?? []).map(q => {
            const serviceName = Array.isArray(q.service) ? q.service[0]?.name : q.service?.name;
            return {
                id: q.id,
                code: q.code ?? q.id.slice(0, 8),
                serviceName: serviceName ?? 'Evento',
                eventDate: q.event_start_date ?? '',
                attendees: q.attendees ?? 50,
                amount: q.total_client_price ?? 0,
            };
        });
    } catch (error) {
        logger.error('[ClientDataService] Error fetching completed events:', error);
        return [];
    }
}

// ─── Payment History ────────────────────────────────────────────────────────

export interface PaymentRecord {
    id: string;
    quotationCode: string;
    quotationId: string;
    serviceName: string;
    amount: number;
    status: string;
    gateway: string;
    paidAt: string | null;
    createdAt: string;
}

/**
 * Fetch client's payment history.
 */
export async function getClientPaymentHistory(userId: string): Promise<PaymentRecord[]> {
    try {
        const supabase = createServiceRoleClient();

        const { data } = await supabase
            .from('payments')
            .select(`
                id, amount, status, gateway_slug, paid_at, created_at, order_id
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!data || data.length === 0) return [];

        // Fetch related quotation info
        const orderIds = [...new Set(data.map(p => p.order_id))];
        const { data: quotations } = await supabase
            .from('quotations')
            .select('id, code, service:services(name)')
            .in('id', orderIds);

        type QuotRow = {
            id: string;
            code: string | null;
            service: { name: string } | { name: string }[] | null;
        };

        const quotMap = new Map<string, QuotRow>();
        for (const q of (quotations as unknown as QuotRow[]) ?? []) {
            quotMap.set(q.id, q);
        }

        const GATEWAY_LABELS: Record<string, string> = {
            webpay: 'Webpay',
            manual_transfer: 'Transferencia',
        };

        return data.map(p => {
            const quot = quotMap.get(p.order_id);
            const serviceName = quot?.service
                ? (Array.isArray(quot.service) ? quot.service[0]?.name : quot.service?.name)
                : 'Servicio';

            return {
                id: p.id,
                quotationCode: quot?.code ?? p.order_id.slice(0, 8),
                quotationId: p.order_id,
                serviceName: serviceName ?? 'Servicio',
                amount: p.amount,
                status: p.status,
                gateway: GATEWAY_LABELS[p.gateway_slug] ?? p.gateway_slug,
                paidAt: p.paid_at,
                createdAt: p.created_at,
            };
        });
    } catch (error) {
        logger.error('[ClientDataService] Error fetching payment history:', error);
        return [];
    }
}

// ─── Financial Summary ──────────────────────────────────────────────────────

export interface FinancialSummary {
    totalPaid: number;
    totalPending: number;
    paymentCount: number;
    lastPaymentDate: string | null;
}

/**
 * Fetch client's financial summary.
 */
export async function getClientFinancialSummary(userId: string): Promise<FinancialSummary> {
    try {
        const supabase = createServiceRoleClient();

        const [paidResult, pendingResult, lastResult] = await Promise.all([
            supabase
                .from('payments')
                .select('amount')
                .eq('user_id', userId)
                .eq('status', 'approved'),
            supabase
                .from('payments')
                .select('amount, order_id, created_at')
                .eq('user_id', userId)
                .in('status', ['pending', 'processing', 'pending_review']),
            supabase
                .from('payments')
                .select('paid_at')
                .eq('user_id', userId)
                .eq('status', 'approved')
                .order('paid_at', { ascending: false })
                .limit(1),
        ]);

        const totalPaid = paidResult.data?.reduce((s, p) => s + (Number(p.amount) || 0), 0) ?? 0;
        
        // Deduplicate pending payments by order_id to prevent summing up multiple checkout attempts for the same quotation
        const pendingMap = new Map<string, number>();
        const pendingRows = pendingResult.data || [];
        
        // Sort ascending so later attempts overwrite previous ones
        pendingRows.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        for (const p of pendingRows) {
            if (p.order_id) {
                pendingMap.set(p.order_id, Number(p.amount) || 0);
            }
        }

        const totalPending = Array.from(pendingMap.values()).reduce((s, amt) => s + amt, 0);
        const paymentCount = (paidResult.data?.length ?? 0) + pendingMap.size;
        const lastPaymentDate = lastResult.data?.[0]?.paid_at ?? null;

        return { totalPaid, totalPending, paymentCount, lastPaymentDate };
    } catch (error) {
        logger.error('[ClientDataService] Error fetching financial summary:', error);
        return { totalPaid: 0, totalPending: 0, paymentCount: 0, lastPaymentDate: null };
    }
}

// ─── Calendar Events ────────────────────────────────────────────────────────

export interface CalendarEvent {
    id: string;
    code: string;
    serviceName: string;
    eventDate: string;
    status: string;
    publicStatus: string;
    amount: number;
}

/**
 * Fetch all client quotations with event dates for calendar view.
 */
export async function getClientCalendarEvents(userId: string): Promise<CalendarEvent[]> {
    try {
        const supabase = createServiceRoleClient();

        const { data } = await supabase
            .from('quotations')
            .select(`
                id, code, event_start_date, status, public_status, total_client_price,
                service:services(name)
            `)
            .eq('client_id', userId)
            .not('event_start_date', 'is', null)
            .order('event_start_date', { ascending: true });

        type DbRow = {
            id: string;
            code: string | null;
            event_start_date: string;
            status: string;
            public_status: string;
            total_client_price: number | null;
            service: { name: string } | { name: string }[] | null;
        };

        return ((data as unknown as DbRow[]) ?? []).map(q => {
            const serviceName = Array.isArray(q.service) ? q.service[0]?.name : q.service?.name;
            return {
                id: q.id,
                code: q.code ?? q.id.slice(0, 8),
                serviceName: serviceName ?? 'Evento',
                eventDate: q.event_start_date,
                status: q.status,
                publicStatus: q.public_status,
                amount: q.total_client_price ?? 0,
            };
        });
    } catch (error) {
        logger.error('[ClientDataService] Error fetching calendar events:', error);
        return [];
    }
}

// ─── Quotation Comparator ───────────────────────────────────────────────────

export interface ComparableQuotation {
    id: string;
    code: string;
    serviceName: string;
    eventDate: string;
    attendees: number;
    amount: number;
    status: string;
    publicStatus: string;
    createdAt: string;
    eventLocation: string;
}

/**
 * Fetch client's quotations for comparison view.
 */
export async function getClientQuotationsForComparison(userId: string): Promise<ComparableQuotation[]> {
    try {
        const supabase = createServiceRoleClient();

        const { data } = await supabase
            .from('quotations')
            .select(`
                id, code, event_start_date, attendees, total_client_price,
                status, public_status, created_at, event_location,
                service:services(name)
            `)
            .eq('client_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        type DbRow = {
            id: string;
            code: string | null;
            event_start_date: string | null;
            attendees: number | null;
            total_client_price: number | null;
            status: string;
            public_status: string;
            created_at: string;
            event_location: string | null;
            service: { name: string } | { name: string }[] | null;
        };

        return ((data as unknown as DbRow[]) ?? []).map(q => {
            const serviceName = Array.isArray(q.service) ? q.service[0]?.name : q.service?.name;
            return {
                id: q.id,
                code: q.code ?? q.id.slice(0, 8),
                serviceName: serviceName ?? 'Servicio',
                eventDate: q.event_start_date ?? '',
                attendees: q.attendees ?? 0,
                amount: q.total_client_price ?? 0,
                status: q.status,
                publicStatus: q.public_status,
                createdAt: q.created_at,
                eventLocation: q.event_location ?? 'N/A',
            };
        });
    } catch (error) {
        logger.error('[ClientDataService] Error fetching comparable quotations:', error);
        return [];
    }
}



