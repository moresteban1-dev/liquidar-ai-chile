import { Result, ok, fail } from '@core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing'
import { Money, Currency } from '@core/domain/value-objects/Money'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { CreateQuotationCommand } from '../commands/CreateQuotationCommand'
import { metricsCollector } from '@infrastructure/telemetry/MetricsCollector'
import { TAX_CONFIG } from '@domain/pricing/TaxConfig'
import { AppError } from '@/core/shared/AppError'

export class CreateQuotationHandler extends InstrumentedHandler<CreateQuotationCommand, Quotation, AppError> {
  protected handlerName = 'CreateQuotation'
  protected operationType = 'command' as const

  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly quotationRepository: IQuotationRepository
  ) { super() }

  protected async handle(command: CreateQuotationCommand): Promise<Result<Quotation, AppError>> {
    const orderResult = await this.orderRepository.findById(new UniqueEntityID(command.orderId))
    if (orderResult.isFailure()) return orderResult
    
    const order = orderResult.unwrap()
    if (!order) return fail(AppError.notFound('Order', command.orderId))
    
    if (order.state !== 'QUOTATION_PENDING') {
        return fail(AppError.business(`Estado inválido para cotizar: ${order.state}`))
    }

    const costResult = Money.create(command.providerCost, command.currency as Currency)
    if (costResult.isFailure()) {
        return fail(AppError.validation(costResult.getError()))
    }

    const pricingResult = QuotationPricing.calculate(costResult.unwrap(), { 
      commissionRate: command.commissionRate,
      platformFeeRate: 0.05,
      taxRate: TAX_CONFIG.IVA_RATE
    })
    
    if (pricingResult.isFailure()) {
        return fail(AppError.business(pricingResult.getError()))
    }
    
    const pricing = pricingResult.unwrap()

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + (command.validDays || 7))

    const quotationResult = Quotation.create({
      orderId: order.orderId,
      providerId: new UniqueEntityID(command.providerId),
      status: 'DRAFT',
      pricing,
      serviceDescription: command.serviceDescription,
      includes: command.includes,
      excludes: command.excludes || [],
      validUntil,
      estimatedDeliveryDays: command.estimatedDeliveryDays || 3,
      requestedItems: [],
      providerItems: [],
      clientItems: [],
      items: [],
      eventDate: order.eventDate,
      clientId: order.clientId.toString(),
      serviceId: 'SERVICE-GENERIC',
      code: `QT-${order.orderId.toString().substring(0, 8)}`,
      subtotalServicesProvider: pricing.providerCost,
      subtotalLogisticsProvider: Money.zero(costResult.unwrap().currency),
      totalProviderNet: pricing.providerCost,
      commissionServicesNet: pricing.adminCommission,
      commissionLogisticsNet: Money.zero(costResult.unwrap().currency),
      totalCommissionNet: pricing.adminCommission,
      commissionMethod: 'PERCENTAGE',
      totalNet: pricing.finalPrice, 
      totalIva: pricing.taxes,
      totalWithIva: pricing.finalPrice,
      providerSuggestsTechnicalVisit: false,
      technicalVisit: false,
      expiresAt: validUntil,
      createdAt: new Date(),
    })

    if (quotationResult.isFailure()) {
        return fail(AppError.business(quotationResult.getError() as string))
    }
    
    const quotation = quotationResult.unwrap()

    const saveResult = await this.quotationRepository.save(quotation)
    if (saveResult.isFailure()) return saveResult

    metricsCollector.recordQuotationCreated({ 
      orderId: command.orderId, 
      providerId: command.providerId, 
      amount: pricing.finalPrice.amount.toString() 
    })
    
    return ok(quotation)
  }

  protected extractSpanAttributes(command: CreateQuotationCommand) {
    return { 'order.id': command.orderId, 'provider.id': command.providerId }
  }
}
