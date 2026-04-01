import { Result, Success, fail } from '@/core/shared/Result'
import { AppError } from '@/core/shared/AppError'
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

  protected async handle(command: AssignProviderToOrderCommand): Promise<Result<Order, AppError>> {
    const orderResult = await this.orderRepository.findById(new UniqueEntityID(command.orderId))
    if (orderResult.isFailure()) return orderResult as any
    const order = orderResult.getValue()
    if (!order) return fail(AppError.notFound('Order', command.orderId))

    const assignResult = order.assignProvider(new UniqueEntityID(command.providerId))
    if (assignResult.isFailure()) return fail(AppError.business(assignResult.getError()))

    const saveResult = await this.orderRepository.save(order)
    if (saveResult.isFailure()) return saveResult

    return new Success(order)
  }

  protected extractSpanAttributes(command: AssignProviderToOrderCommand) {
    return { 'order.id': command.orderId, 'provider.id': command.providerId }
  }
}
