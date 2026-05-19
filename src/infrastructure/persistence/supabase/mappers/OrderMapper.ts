import { Order, OrderProps, OrderState } from '@core/domain/aggregates/order/Order'
import { QuotationPricing, PricingBreakdown } from '@core/domain/aggregates/order/QuotationPricing'
import { Money } from '@core/domain/value-objects/Money'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { Result, Failure as _Failure } from '@core/shared/Result'

interface OrderPersistence {
  id: string
  client_id: string
  provider_id?: string
  quotation_id?: string
  state: string
  event_date: string
  event_type?: string
  estimated_guests?: number
  delivery_address: string
  special_instructions?: string
  admin_notes?: string
  created_at: string
  updated_at: string
  completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  deleted_at?: string
}

interface PricingPersistence {
  order_id: string
  provider_cost: number
  admin_commission: number
  platform_fee: number
  taxes: number
  final_price: number
  currency: string
}

export class OrderMapper {
  /**
   * Persistence → Domain
   */
  public static toDomain(
    raw: any,
    pricingRaw?: PricingPersistence
  ): Result<Order, string> {
    try {
      if (!raw.id || !raw.client_id || !(raw.state || raw.status)) {
        return Result.fail('Missing required fields in persistence data')
      }

      let pricing: QuotationPricing | undefined

      if (pricingRaw) {
        const pricingResult = this.pricingToDomain(pricingRaw)
        if (pricingResult.isFailure()) {
          return pricingResult
        }
        pricing = pricingResult.unwrap()
      }

      const props: OrderProps = {
        clientId: new UniqueEntityID(raw.client_id),
        state: this.mapToDomainState(raw.state || raw.status),
        eventDate: new Date(raw.event_date),
        deliveryAddress: raw.delivery_address,
        createdAt: new Date(raw.created_at),
        updatedAt: new Date(raw.updated_at)
      }

      if (raw.provider_id) props.providerId = new UniqueEntityID(raw.provider_id)
      if (raw.quotation_id) props.quotationId = new UniqueEntityID(raw.quotation_id)
      if (pricing) props.pricing = pricing
      if (raw.event_type) props.eventType = raw.event_type
      if (raw.estimated_guests !== undefined) props.estimatedGuests = raw.estimated_guests
      if (raw.client_notes || raw.special_instructions) props.specialInstructions = raw.client_notes || raw.special_instructions
      if (raw.internal_notes || raw.admin_notes) props.adminNotes = raw.internal_notes || raw.admin_notes
      if (raw.completed_at) props.completedAt = new Date(raw.completed_at)
      if (raw.cancelled_at) props.cancelledAt = new Date(raw.cancelled_at)
      if (raw.cancellation_reason) props.cancellationReason = raw.cancellation_reason

      return Order.create(props, new UniqueEntityID(raw.id)) as Result<Order, string>

    } catch (error) {
      return Result.fail(`Mapping error: ${(error as Error).message}`)
    }
  }

  private static mapToDBStatus(state: string): string {
    switch(state) {
      case 'DRAFT': return 'EN_REVISION';
      case 'QUOTATION_PENDING': return 'EN_REVISION';
      case 'QUOTATION_SENT': return 'EN_REVISION';
      case 'QUOTATION_APPROVED': return 'CONFIRMADA';
      case 'PAYMENT_PENDING': return 'CONFIRMADA';
      case 'PAYMENT_RECEIVED': return 'PAGADA';
      case 'IN_PRODUCTION': return 'EN_PRODUCCION';
      case 'DELIVERED': return 'ENTREGADA';
      case 'COMPLETED': return 'COMPLETADA';
      case 'CANCELLED': return 'CANCELADA';
      default: return 'EN_REVISION';
    }
  }

  private static mapToDomainState(status: string): OrderState {
    const validStates: OrderState[] = [
      'DRAFT',
      'QUOTATION_PENDING',
      'QUOTATION_SENT',
      'QUOTATION_APPROVED',
      'PAYMENT_PENDING',
      'PAYMENT_RECEIVED',
      'IN_PRODUCTION',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED'
    ];
    if (validStates.includes(status as any)) {
      return status as OrderState;
    }

    switch(status) {
      case 'EN_REVISION': return 'QUOTATION_PENDING';
      case 'REVISION_INTERNA': return 'QUOTATION_PENDING';
      case 'CONFIRMADA': return 'QUOTATION_APPROVED';
      case 'PAGADA': return 'PAYMENT_RECEIVED';
      case 'EN_PRODUCCION': return 'IN_PRODUCTION';
      case 'ENTREGADA': return 'DELIVERED';
      case 'COMPLETADA': return 'COMPLETED';
      case 'CANCELADA': return 'CANCELLED';
      default: return 'QUOTATION_PENDING';
    }
  }

  /**
   * Domain → Persistence
   */
  public static toPersistence(order: Order): any {
    const raw: any = {
      id: order.id.toString(),
      code: `ORD-${order.id.toString().substring(0, 8).toUpperCase()}`, // Auto-generate required code
      client_id: order.clientId.toString(),
      provider_id: order.props.providerId?.toString(),
      quotation_id: order.props.quotationId?.toString(),
      state: order.state, // Map domain state directly for V2
      status: this.mapToDBStatus(order.state), // Map domain state to DB status for V1
      event_date: order.eventDate.toISOString(),
      event_type: order.props.eventType,
      estimated_guests: order.props.estimatedGuests,
      delivery_address: order.deliveryAddress,
      special_instructions: order.props.specialInstructions, // Set both special_instructions
      client_notes: order.props.specialInstructions, // and client_notes for V1/V2 compatibility
      admin_notes: order.props.adminNotes, // Set both admin_notes
      internal_notes: order.props.adminNotes, // and internal_notes for V1/V2 compatibility
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
      completed_at: order.completedAt?.toISOString(),
      cancelled_at: order.cancelledAt?.toISOString(),
      cancellation_reason: order.cancellationReason,
      // Default values to satisfy NOT NULL constraints from 001_initial_schema
      price_net: 0,
      price_iva: 0,
      price_total: 0
    };

    // Remove undefined values to avoid PostgREST schema errors
    Object.keys(raw).forEach(key => {
        if (raw[key] === undefined) {
            delete raw[key];
        }
    });

    return raw;
  }

  /**
   * QuotationPricing → Persistence
   */
  public static pricingToPersistence(
    orderId: UniqueEntityID,
    pricing: QuotationPricing
  ): PricingPersistence {
    return {
      order_id: orderId.toString(),
      provider_cost: pricing.providerCost.amount,
      admin_commission: pricing.adminCommission.amount,
      platform_fee: pricing.platformFee.amount,
      taxes: pricing.taxes.amount,
      final_price: pricing.finalPrice.amount,
      currency: pricing.finalPrice.currency
    }
  }

  /**
   * Persistence → QuotationPricing
   */
  private static pricingToDomain(raw: PricingPersistence): Result<QuotationPricing, string> {
    try {
      const providerCostResult = Money.create(raw.provider_cost, raw.currency as any)
      if (providerCostResult.isFailure()) {
        return Result.fail(providerCostResult.getError())
      }

      const adminCommissionResult = Money.create(raw.admin_commission, raw.currency as any)
      if (adminCommissionResult.isFailure()) {
        return Result.fail(adminCommissionResult.getError())
      }

      const platformFeeResult = Money.create(raw.platform_fee, raw.currency as any)
      if (platformFeeResult.isFailure()) {
        return Result.fail(platformFeeResult.getError())
      }

      const taxesResult = Money.create(raw.taxes, raw.currency as any)
      if (taxesResult.isFailure()) {
        return Result.fail(taxesResult.getError())
      }

      const finalPriceResult = Money.create(raw.final_price, raw.currency as any)
      if (finalPriceResult.isFailure()) {
        return Result.fail(finalPriceResult.getError())
      }

      const breakdown: PricingBreakdown = {
        providerCost: providerCostResult.unwrap(),
        adminCommission: adminCommissionResult.unwrap(),
        platformFee: platformFeeResult.unwrap(),
        taxes: taxesResult.unwrap(),
        finalPrice: finalPriceResult.unwrap()
      }

      return QuotationPricing.fromBreakdown(breakdown)

    } catch (error) {
      return Result.fail(`Pricing mapping error: ${(error as Error).message}`)
    }
  }
}
