import { Result, ok, fail } from '@/core/shared/Result'
import { AppError } from '@/core/shared/AppError'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { Order } from '@/core/domain/aggregates/order/Order'

export class AttachQuotationToOrderHandler extends InstrumentedHandler<{ orderId: string; quotationId: string }, Order> {
  protected handlerName = 'AttachQuotationToOrder'
  protected operationType = 'command' as const

  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly quotationRepository: IQuotationRepository
  ) { super() }

  protected async handle(command: { orderId: string; quotationId: string }): Promise<Result<Order, AppError>> {
    const orderResult = await this.orderRepository.findById(new UniqueEntityID(command.orderId))
    if (orderResult.isFailure()) return orderResult
    const order = orderResult.unwrap()
    if (!order) return fail(AppError.notFound('Order', command.orderId))

    const quotationResult = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationResult.isFailure()) {
        return fail(AppError.business(String(quotationResult.getError())))
    }
    const quotation = quotationResult.unwrap()
    if (!quotation) return fail(AppError.notFound('Quotation', command.quotationId))

    order.attachQuotation(quotation.quotationId, quotation.pricing)
    const saveResult = await this.orderRepository.save(order)
    if (saveResult.isFailure()) return saveResult

    return ok(order)
  }

  protected extractSpanAttributes(command: { orderId: string; quotationId: string }) {
    return { 'order.id': command.orderId, 'quotation.id': command.quotationId }
  }
}
