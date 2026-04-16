import { Result, ok, fail } from '@core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { IDomainEventBus } from '@app/ports/IDomainEventBus'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { RejectQuotationCommand } from '../commands/RejectQuotationCommand'
import { getTelemetryProvider } from '../ports/ITelemetryPort'
import { AppError } from '@/core/shared/AppError'

export class RejectQuotationHandler extends InstrumentedHandler<RejectQuotationCommand, Quotation, AppError> {
  protected handlerName = 'RejectQuotation'
  protected operationType = 'command' as const

  constructor(
    private readonly quotationRepository: IQuotationRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly eventBus: IDomainEventBus
  ) { super() }

  protected async handle(command: RejectQuotationCommand): Promise<Result<Quotation, AppError>> {
    const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationRes.isFailure()) {
        return fail(AppError.business(String(quotationRes.getError())))
    }
    
    const quotation = quotationRes.unwrap()
    if (!quotation) return fail(AppError.notFound('Quotation', command.quotationId))

    const orderRes = await this.orderRepository.findById(quotation.orderId)
    if (orderRes.isFailure()) return orderRes as any
    
    const order = orderRes.unwrap()
    if (!order) return fail(AppError.notFound('Order', quotation.orderId.toString()))

    const rejectResult = quotation.reject(command.reason)
    if (rejectResult.isFailure()) {
        return fail(AppError.business(String(rejectResult.getError())))
    }

    order.transition('QUOTATION_PENDING')
    
    const saveOrderRes = await this.orderRepository.save(order)
    if (saveOrderRes.isFailure()) return saveOrderRes

    const saveQuotationRes = await this.quotationRepository.save(quotation)
    if (saveQuotationRes.isFailure()) return saveQuotationRes

    // Publish events
    const events = [...order.pullDomainEvents(), ...quotation.pullDomainEvents()]
    if (events.length > 0) {
      const transportEvents = events.map(e => e.toJSON() as any);
      await this.eventBus.publishAll(transportEvents)
    }

    getTelemetryProvider().metrics.recordQuotationRejected({ 
      orderId: order.orderId.toString(), 
      reason: command.reason 
    })
    
    return ok(quotation)
  }

  protected extractSpanAttributes(command: RejectQuotationCommand) {
    return { 'quotation.id': command.quotationId, 'reason': command.reason }
  }
}
