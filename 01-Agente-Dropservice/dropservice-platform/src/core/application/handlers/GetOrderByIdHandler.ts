import { Result, ok, fail } from '@/core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { Order } from '@/core/domain/aggregates/order/Order'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { AppError } from '@/core/shared/AppError'

export class GetOrderByIdHandler extends InstrumentedHandler<{ orderId: string }, Order, AppError> {
  protected handlerName = 'GetOrderById'
  protected operationType = 'query' as const

  constructor(private readonly orderRepository: IOrderRepository) {
    super()
  }

  protected async handle(query: { orderId: string }): Promise<Result<Order, AppError>> {
    const orderResult = await this.orderRepository.findById(new UniqueEntityID(query.orderId))
    
    if (orderResult.isFailure()) return orderResult
    
    if (!orderResult.unwrap()) {
        return fail(AppError.notFound('Order', query.orderId))
    }
    
    return ok(orderResult.unwrap())
  }

  protected extractSpanAttributes(query: { orderId: string }) {
    return { 'order.id': query.orderId }
  }
}
