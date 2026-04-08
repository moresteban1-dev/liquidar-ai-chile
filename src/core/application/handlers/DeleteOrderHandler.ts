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
    
    if (orderResult.isFailure()) return fail(AppError.from(orderResult.getError()))
    
    const order = orderResult.unwrap()
    if (!order) {
        return fail(AppError.notFound('Order', command.orderId))
    }

    const { UserRole, normalizeRole } = await import('@/core/domain/auth/UserRole');
    const normalizedRole = normalizeRole(command.performedByRole);

    const isAdmin = normalizedRole === UserRole.ADMIN
    const isClient = normalizedRole === UserRole.CLIENT
    const isOwner = order.clientId.toString() === command.performedBy

    if (isClient) {
      if (!isOwner) {
        return fail(AppError.unauthorized('Cannot delete other clients own orders'))
      }
      if (order.state !== 'DRAFT') {
        return fail(AppError.businessRule('Client can only delete DRAFT orders'))
      }
    }

    if (isAdmin) {
      if (['PAYMENT_RECEIVED', 'IN_PRODUCTION', 'COMPLETED'].includes(order.state)) {
        return fail(AppError.businessRule(`Cannot delete order in ${order.state} state`))
      }
    }

    if (order.state === 'DRAFT') {
      const deleteResult = await this.orderRepository.delete(order.id)
      if (deleteResult.isFailure()) return fail(AppError.from(deleteResult.getError()))
    } else {
      const reason = command.reason || 'No reason provided'
      const cancelResult = order.cancel(reason)
      if (cancelResult.isFailure()) {
        return fail(AppError.businessRule(cancelResult.getError() || 'Cancellation failed'))
      }
      
      const saveResult = await this.orderRepository.save(order)
      if (saveResult.isFailure()) return fail(AppError.from(saveResult.getError()))
    }

    return ok(undefined)
  }

  protected extractSpanAttributes(command: DeleteOrderCommand) {
    return { 'order.id': command.orderId, 'role': command.performedByRole }
  }
}
