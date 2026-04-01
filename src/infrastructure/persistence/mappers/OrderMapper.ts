import { Order, OrderState } from '@core/domain/aggregates/order/Order';
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { Result, ok, fail } from '@core/shared/Result';

export interface OrderRow {
    id: string;
    client_id: string;
    service_id?: string;
    provider_id?: string | null;
    quotation_id?: string | null;
    status: string;
    price_amount?: number;
    price_currency?: string;
    platform_fee_amount?: number;
    platform_fee_currency?: string;
    event_date: string;
    delivery_address: string;
    created_at: string;
    updated_at: string;
    event_type?: string | null;
    estimated_guests?: number | null;
    special_instructions?: string | null;
    admin_notes?: string | null;
    completed_at?: string | null;
    cancelled_at?: string | null;
    cancellation_reason?: string | null;
}

/**
 * NASA-Grade Engineering: Order Mapper
 * 
 * Synchronizes the Order Aggregate with Supabase persistence.
 */
export class OrderMapper {
    /**
     * Transforms a persistence row into a domain aggregate.
     */
    static toDomain(row: OrderRow): Result<Order, string> {
        try {
            // 1. Reconstitute Pricing if available
            let pricing: QuotationPricing | undefined = undefined;
            if (row.price_amount !== undefined && row.price_amount !== null) {
                const pricingRes = QuotationPricing.create({
                    providerCost: Number(row.price_amount) - (Number(row.platform_fee_amount) || 0),
                    adminMargin: Number(row.platform_fee_amount) || 0,
                    clientPrice: Number(row.price_amount),
                    currency: row.price_currency || 'CLP'
                });
                if (pricingRes.isSuccess()) {
                    pricing = pricingRes.getValue();
                }
            }

            // 2. Reconstitute Order
            const orderRes = Order.reconstitute({
                clientId: new UniqueEntityID(row.client_id),
                providerId: row.provider_id ? new UniqueEntityID(row.provider_id) : undefined,
                quotationId: row.quotation_id ? new UniqueEntityID(row.quotation_id) : undefined,
                state: row.status as OrderState,
                pricing,
                eventDate: new Date(row.event_date),
                deliveryAddress: row.delivery_address || 'Sin dirección',
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
                eventType: row.event_type || undefined,
                estimatedGuests: row.estimated_guests || undefined,
                specialInstructions: row.special_instructions || undefined,
                adminNotes: row.admin_notes || undefined,
                completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
                cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
                cancellationReason: row.cancellation_reason || undefined
            }, row.id);

            if (orderRes.isFailure()) {
                return fail(`Error al reconstituir pedido ${row.id}: ${orderRes.getError()}`);
            }

            return ok(orderRes.getValue());
        } catch (error) {
            return fail(`Excepción al mapear pedido: ${(error as Error).message}`);
        }
    }

    /**
     * Transforms a domain aggregate into a persistence-ready row.
     */
    static toPersistence(order: Order): OrderRow {
        return {
            id: order.id.toString(),
            client_id: order.clientId.toString(),
            provider_id: order.providerId ? order.providerId.toString() : null,
            quotation_id: order.quotationId ? order.quotationId.toString() : null,
            status: order.state,
            price_amount: order.pricing?.finalPrice.amount ?? 0,
            price_currency: order.pricing?.finalPrice.currency ?? 'CLP',
            platform_fee_amount: order.pricing?.adminCommission.amount ?? 0,
            platform_fee_currency: order.pricing?.adminCommission.currency ?? 'CLP',
            event_date: order.eventDate.toISOString(),
            delivery_address: order.deliveryAddress,
            created_at: order.createdAt.toISOString(),
            updated_at: order.updatedAt.toISOString(),
            event_type: order.props.eventType || null,
            estimated_guests: order.props.estimatedGuests || null,
            special_instructions: order.props.specialInstructions || null,
            admin_notes: order.props.adminNotes || null,
            completed_at: order.props.completedAt?.toISOString() || null,
            cancelled_at: order.props.cancelledAt?.toISOString() || null,
            cancellation_reason: order.props.cancellationReason || null
        };
    }
}
