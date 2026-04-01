'use server';

import { requireRole, createApiClient, createServiceRoleClient } from '@/lib/supabase/api';
import { QuotationPublicStatus } from '@/lib/types';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { UserRole } from '@/core/domain/auth/UserRole';

export interface QuotationListItem {
    id: string;
    code: string;
    brief: string;
    status: string;
    publicStatus: string;
    priceCost: number | null;
    priceTotal: number | null;
    createdAt: string;
    service?: { name: string } | null;
    client?: { name: string; email: string } | null;
    assignedProvider?: { name: string } | null;
    // Event details (vendor form)
    eventStartDate?: string | null;
    eventLocation?: string | null;
    eventAddress?: string | null;
    eventTime?: string | null;
    setupTime?: string | null;
    teardownTime?: string | null;
    eventEndTime?: string | null;
    technicalVisit?: boolean;
    clientName?: string | null;
}

/**
 * Get Recent Quotations for Client Dashboard
 */
export async function getRecentClientQuotations(limit = 4) {
    try {
        const authResult = await requireRole(UserRole.CLIENT);
        if (authResult.isFailure()) throw new Error(authResult.getError().message);
        const { user } = authResult.getValue();

        const clientResult = await createApiClient();
        if (clientResult.isFailure()) throw new Error(clientResult.getError().message);
        const supabase = clientResult.getValue();

        const { data, error } = await supabase
            .from('quotations')
            .select(`
                id, 
                code, 
                public_status, 
                created_at, 
                price_total,
                brief,
                service:services(name, image_url)
            `)
            .eq('client_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw new Error(error.message);

        type QuotationQueryResult = {
            id: string;
            code: string;
            public_status: QuotationPublicStatus;
            created_at: string;
            price_total: number | null;
            brief: string | null;
            service: {
                name: string;
                image_url: string | null;
            } | null;
        };

        return (data as unknown as QuotationQueryResult[]).map((q) => ({
            id: q.id,
            code: q.code,
            publicStatus: q.public_status,
            createdAt: q.created_at,
            priceTotal: q.price_total,
            brief: q.brief,
            service: {
                name: q.service?.name || 'Servicio General',
                imageUrl: q.service?.image_url || null
            }
        }));

    } catch (error) {
        // Reemplazo posterior en fetchRecentQuotations
        logger.error('Error fetching recent quotes:', error);
        return [];
    }
}

/**
 * Get All Quotations for Client
 */
export async function getClientQuotations() {
    try {
        const authResult = await requireRole(UserRole.CLIENT);
        if (authResult.isFailure()) throw new Error(authResult.getError().message);
        const { user } = authResult.getValue();

        const clientResult = await createApiClient();
        if (clientResult.isFailure()) throw new Error(clientResult.getError().message);
        const supabase = clientResult.getValue();

        const { data, error } = await supabase
            .from('quotations')
            .select(`
                id, 
                code, 
                public_status, 
                created_at, 
                price_total,
                brief,
                service:services(name, image_url)
            `)
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        type QuotationQueryResult = {
            id: string;
            code: string;
            public_status: QuotationPublicStatus;
            created_at: string;
            price_total: number | null;
            brief: string | null;
            service: {
                name: string;
                image_url: string | null;
            } | null;
        };

        return (data as unknown as QuotationQueryResult[]).map((q) => ({
            id: q.id,
            code: q.code,
            publicStatus: q.public_status,
            createdAt: q.created_at,
            priceTotal: q.price_total,
            brief: q.brief,
            service: {
                name: q.service?.name || 'Servicio General',
                imageUrl: q.service?.image_url || null
            }
        }));

    } catch (error) {
        logger.error('Error fetching all client quotes:', error);
        return [];
    }
}

/**
 * Fetches all quotations for admin table page.
 * Server-side only — used in RSC pages.
 */
export async function getAdminQuotations(): Promise<QuotationListItem[]> {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) return [];
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
        .from('quotations')
        .select(`
            *,
            service:services(name),
            client:profiles!quotations_client_id_fkey(name, email),
            assigned_provider:profiles!quotations_assigned_provider_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((q: Record<string, unknown>) => ({
        id: q.id as string,
        code: q.code as string,
        brief: (q.brief as string) || '',
        status: q.status as string,
        publicStatus: (q.public_status as string) || q.status as string,
        priceCost: (q.price_cost as number) || null,
        priceTotal: (q.price_total as number) || null,
        createdAt: q.created_at as string,
        service: q.service as QuotationListItem['service'],
        client: q.client as QuotationListItem['client'],
        assignedProvider: q.assigned_provider as QuotationListItem['assignedProvider'],
    }));
}

/**
 * Fetches quotations assigned to the current vendor.
 */
export async function getVendorQuotations(): Promise<QuotationListItem[]> {
    const authResult = await requireRole(UserRole.VENDOR);
    if (authResult.isFailure()) return [];
    const { user } = authResult.getValue();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
        .from('quotations')
        .select(`
            *,
            service:services(name),
            client:profiles!quotations_client_id_fkey(name)
        `)
        .eq('assigned_provider_id', user.id)
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((q: Record<string, unknown>) => ({
        id: q.id as string,
        code: q.code as string,
        brief: (q.brief as string) || '',
        status: q.status as string,
        publicStatus: (q.public_status as string) || q.status as string,
        priceCost: (q.price_cost as number) || null,
        priceTotal: null,
        createdAt: q.created_at as string,
        service: q.service as QuotationListItem['service'],
        eventStartDate: (q.event_start_date as string) || null,
        eventLocation: (q.event_location as string) || null,
        eventAddress: (q.event_address as string) || null,
        eventTime: (q.event_time as string) || null,
        setupTime: (q.setup_time as string) || null,
        teardownTime: (q.teardown_time as string) || null,
        eventEndTime: (q.event_end_time as string) || null,
        technicalVisit: (q.technical_visit as boolean) || false,
        clientName: ((q.client as Record<string, unknown> | null)?.name as string) || null,
    }));
}

export interface VendorOrderItem {
    id: string;
    code: string;
    status: string;
    priceCost: number;
    deliveryDate: string | null;
    createdAt: string;
    brief: string;
    name: string;
    quotation?: { brief: string; service?: { name: string } } | null;
    service?: { name: string };
}

/**
 * Fetches orders assigned to the current vendor.
 */
export async function getVendorOrders(): Promise<VendorOrderItem[]> {
    const authResult = await requireRole(UserRole.VENDOR);
    if (authResult.isFailure()) return [];
    const { user } = authResult.getValue();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            quotation:quotations!orders_quotation_id_fkey(brief, service:services(name))
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((o: Record<string, unknown>) => ({
        id: o.id as string,
        code: o.code as string,
        status: o.status as string,
        priceCost: (o.price_cost as number) || 0,
        deliveryDate: (o.delivery_date as string) || null,
        createdAt: o.created_at as string,
        brief: '',
        name: '',
        quotation: o.quotation as VendorOrderItem['quotation'],
    }));
}
