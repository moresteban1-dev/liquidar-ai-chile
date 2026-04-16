import { Result, ok, fail } from '@core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { IDomainEventBus } from '@app/ports/IDomainEventBus'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { ApproveQuotationCommand } from '../commands/ApproveQuotationCommand'
import { getTelemetryProvider } from '../ports/ITelemetryPort'
import { AppError } from '@/core/shared/AppError'

export class ApproveQuotationHandler extends InstrumentedHandler<ApproveQuotationCommand, Quotation, AppError> {
  protected handlerName = 'ApproveQuotation'
  protected operationType = 'command' as const

  constructor(
    private readonly quotationRepository: IQuotationRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly eventBus: IDomainEventBus
  ) { super() }

  protected async handle(command: ApproveQuotationCommand): Promise<Result<Quotation, AppError>> {
    const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationRes.isFailure()) {
        return fail(AppError.business(String(quotationRes.getError())))
    }
    const quotation = quotationRes.unwrap()
    if (!quotation) return fail(AppError.notFound('Quotation', command.quotationId))

    const orderResult = await this.orderRepository.findById(quotation.orderId)
    if (orderResult.isFailure()) return orderResult as any
    const order = orderResult.unwrap()
    if (!order) return fail(AppError.notFound('Order', quotation.orderId.toString()))

    const approveResult = quotation.approve()
    if (approveResult.isFailure()) {
        return fail(AppError.business(String(approveResult.getError())))
    }

    order.approveQuotation()
    order.transition('PAYMENT_PENDING')

    const saveOrderRes = await this.orderRepository.save(order)
    if (saveOrderRes.isFailure()) return saveOrderRes

    const saveQuotationRes = await this.quotationRepository.save(quotation)
    if (saveQuotationRes.isFailure()) return saveQuotationRes

    // Publish events
    const events = [...order.pullDomainEvents(), ...quotation.pullDomainEvents()]
    if (events.length > 0) {
      // Map class-based events to the transport format expected by IDomainEventBus
      const transportEvents = events.map(e => e.toJSON() as any);
      await this.eventBus.publishAll(transportEvents)
    }

    getTelemetryProvider().metrics.recordQuotationApproved({ 
      orderId: order.orderId.toString(), 
      amount: String(quotation.pricing.finalPrice.amount), 
      currency: quotation.pricing.finalPrice.currency 
    })
    
    return ok(quotation)
  }

  protected extractSpanAttributes(command: ApproveQuotationCommand) {
    return { 'quotation.id': command.quotationId, 'client.id': command.clientId }
  }
}
