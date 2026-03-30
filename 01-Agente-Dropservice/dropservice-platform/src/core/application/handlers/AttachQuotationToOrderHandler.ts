import { Result, Success, Failure } from '@/core/shared/Result'
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

  protected async handle(command: { orderId: string; quotationId: string }): Promise<Result<Order, string>> {
    const orderResult = await this.orderRepository.findById(new UniqueEntityID(command.orderId))
    if (orderResult.isFailure()) return orderResult as any

    const quotationResult = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId))
    if (quotationResult.isFailure()) return quotationResult as any

    const order = orderResult.unwrap()
    const quotation = quotationResult.unwrap()

    if (!order || !quotation) return new Failure('Order or Quotation not found')

    order.attachQuotation(quotation.quotationId, quotation.pricing)
    const saveResult = await this.orderRepository.save(order)
    if (saveResult.isFailure()) return saveResult as any

    return new Success(order)
  }

  protected extractSpanAttributes(command: { orderId: string; quotationId: string }) {
    return { 'order.id': command.orderId, 'quotation.id': command.quotationId }
  }
}
