'use server';

/**
 * Server-side orders data fetchers for RSC pages.
 * Eliminates client-side useEffect waterfalls.
 */

import { createServiceRoleClient, requireRole } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';

export interface OrderData {
    id: string;
    code: string;
    status: string;
    priceTotal: number;
    priceNet: number;
    priceCost: number;
    marginAmount: number;
    marginPercentage: number;
    createdAt: string;
    deliveryDate: string | null;
    client: { id: string; name: string; email: string } | null;
    quotation: { code: string; brief: string } | null;
    items: { id: string; quantity: number; service: { id: string; name: string } | null }[];
}

/**
 * Fetches all orders for admin with related data.
 * Server-side only — used in RSC pages.
 */
export async function getAdminOrders(): Promise<OrderData[]> {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) return [];
    const { user } = authResult.getValue();

    const supabase = createServiceRoleClient();

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            client:profiles!orders_client_id_fkey(id, name, email),
            items:order_items(*, service:services(id, name)),
            quotation:quotations!orders_quotation_id_fkey(code, brief)
        `)
        .order('created_at', { ascending: false });

    if (error || !orders) return [];

    return orders.map((o: Record<string, unknown>) => ({
        id: o.id as string,
        code: o.code as string,
        status: o.status as string,
        priceTotal: (o.price_total as number) || 0,
        priceNet: (o.price_net as number) || 0,
        priceCost: (o.price_cost as number) || 0,
        marginAmount: (o.margin_amount as number) || 0,
        marginPercentage: (o.margin_percentage as number) || 0,
        createdAt: o.created_at as string,
        deliveryDate: (o.delivery_date as string) || null,
        client: o.client as OrderData['client'],
        quotation: o.quotation as OrderData['quotation'],
        items: ((o.items as unknown[]) || []).map((item: unknown) => {
            const i = item as Record<string, unknown>;
            return {
                id: i.id as string,
                quantity: (i.quantity as number) || 1,
                service: i.service as { id: string; name: string } | null,
            };
        }),
    }));
}

/**
 * Fetches orders for client dashboard (own orders only).
 */
export async function getClientOrders(): Promise<OrderData[]> {
    const authResult = await requireRole(UserRole.CLIENT);
    if (authResult.isFailure()) return [];
    const { user } = authResult.getValue();

    const supabase = createServiceRoleClient();

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            client:profiles!orders_client_id_fkey(id, name, email),
            items:order_items(*, service:services(id, name)),
            quotation:quotations!orders_quotation_id_fkey(code, brief)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

    if (error || !orders) return [];

    // Filter out sensitive fields for client
    return orders.map((o: Record<string, unknown>) => ({
        id: o.id as string,
        code: o.code as string,
        status: o.status as string,
        priceTotal: (o.price_total as number) || 0,
        priceNet: (o.price_net as number) || 0,
        priceCost: 0, // Hidden from client
        marginAmount: 0, // Hidden from client
        marginPercentage: 0, // Hidden from client
        createdAt: o.created_at as string,
        deliveryDate: (o.delivery_date as string) || null,
        client: o.client as OrderData['client'],
        quotation: o.quotation as OrderData['quotation'],
        items: ((o.items as unknown[]) || []).map((item: unknown) => {
            const i = item as Record<string, unknown>;
            return {
                id: i.id as string,
                quantity: (i.quantity as number) || 1,
                service: i.service as { id: string; name: string } | null,
            };
        }),
    }));
}
