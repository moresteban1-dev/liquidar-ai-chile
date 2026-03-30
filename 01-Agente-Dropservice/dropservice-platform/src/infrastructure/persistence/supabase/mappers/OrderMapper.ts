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
    raw: OrderPersistence,
    pricingRaw?: PricingPersistence
  ): Result<Order, string> {
    try {
      if (!raw.id || !raw.client_id || !raw.state) {
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
        state: raw.state as OrderState,
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
      if (raw.special_instructions) props.specialInstructions = raw.special_instructions
      if (raw.admin_notes) props.adminNotes = raw.admin_notes
      if (raw.completed_at) props.completedAt = new Date(raw.completed_at)
      if (raw.cancelled_at) props.cancelledAt = new Date(raw.cancelled_at)
      if (raw.cancellation_reason) props.cancellationReason = raw.cancellation_reason

      return Order.create(props, new UniqueEntityID(raw.id)) as Result<Order, string>

    } catch (error) {
      return Result.fail(`Mapping error: ${(error as Error).message}`)
    }
  }

  /**
   * Domain → Persistence
   */
  public static toPersistence(order: Order): OrderPersistence {
    return {
      id: order.id.toString(),
      client_id: order.clientId.toString(),
      provider_id: order.props.providerId?.toString(),
      quotation_id: order.props.quotationId?.toString(),
      state: order.state,
      event_date: order.eventDate.toISOString(),
      event_type: order.props.eventType,
      estimated_guests: order.props.estimatedGuests,
      delivery_address: order.deliveryAddress,
      special_instructions: order.props.specialInstructions,
      admin_notes: order.props.adminNotes,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
      completed_at: order.completedAt?.toISOString(),
      cancelled_at: order.cancelledAt?.toISOString(),
      cancellation_reason: order.cancellationReason
    }
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
