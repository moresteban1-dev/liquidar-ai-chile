import { Result, ok, fail } from '@/core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { DeleteOrderCommand } from '../commands/DeleteOrderCommand'
import { AppError } from '@/core/shared/AppError'

export class DeleteOrderHandler extends InstrumentedHandler<DeleteOrderCommand, void, AppError> {
  protected handlerName = 'DeleteOrder'
  protected operationType = 'command' as const

  constructor(private readonly orderRepository: IOrderRepository) {
    super()
  }

  protected async handle(command: DeleteOrderCommand): Promise<Result<void, AppError>> {
    const orderResult = await this.orderRepository.findById(new UniqueEntityID(command.orderId))
    
    if (orderResult.isFailure()) return orderResult
    
    const order = orderResult.unwrap()
    if (!order) {
        return fail(AppError.notFound('Order', command.orderId))
    }

    order.cancel(command.reason || 'No reason provided')
    
    const saveResult = await this.orderRepository.save(order)
    if (saveResult.isFailure()) return saveResult

    return ok(undefined)
  }

  protected extractSpanAttributes(command: DeleteOrderCommand) {
    return { 'order.id': command.orderId, 'role': command.performedByRole }
  }
}
