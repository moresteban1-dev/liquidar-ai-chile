import { Result, Success, Failure } from '@/core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { Order } from '@/core/domain/aggregates/order/Order'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { AssignProviderToOrderCommand } from '../commands/AssignProviderToOrderCommand'

export class AssignProviderToOrderHandler extends InstrumentedHandler<AssignProviderToOrderCommand, Order> {
  protected handlerName = 'AssignProviderToOrder'
  protected operationType = 'command' as const

  constructor(private readonly orderRepository: IOrderRepository) {
    super()
  }

  protected async handle(command: AssignProviderToOrderCommand): Promise<Result<Order, string>> {
    const orderResult = await this.orderRepository.findById(new UniqueEntityID(command.orderId))
    if (orderResult.isFailure()) return orderResult as any
    if (!orderResult.getValue()) return new Failure('Order not found')

    const order = orderResult.getValue()
    const assignResult = order.assignProvider(new UniqueEntityID(command.providerId))
    if (assignResult.isFailure()) return assignResult as any

    const saveResult = await this.orderRepository.save(order)
    if (saveResult.isFailure()) return saveResult as any

    return new Success(order)
  }

  protected extractSpanAttributes(command: AssignProviderToOrderCommand) {
    return { 'order.id': command.orderId, 'provider.id': command.providerId }
  }
}
