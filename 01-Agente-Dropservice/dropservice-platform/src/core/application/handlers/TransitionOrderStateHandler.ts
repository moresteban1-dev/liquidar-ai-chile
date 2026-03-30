import { Result, ok, fail } from '@core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository';
import { IDomainEventBus } from '@app/ports/IDomainEventBus'
import { Order, OrderState } from '@core/domain/aggregates/order/Order'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { TransitionOrderStateCommand } from '../commands/TransitionOrderStateCommand'
import { metricsCollector } from '@infrastructure/telemetry/MetricsCollector'
import { AppError } from '@/core/shared/AppError'

const ROLE_PERMISSIONS: Record<string, string[]> = {
  'QUOTATION_PENDING': ['admin'],
  'QUOTATION_SENT': ['admin'],
  'QUOTATION_APPROVED': ['admin', 'client'],
  'PAYMENT_PENDING': ['admin'],
  'PAYMENT_RECEIVED': ['admin'],
  'IN_PRODUCTION': ['admin', 'provider'],
  'DELIVERED': ['admin', 'provider'],
  'COMPLETED': ['admin'],
  'CANCELLED': ['admin', 'client']
}

export class TransitionOrderStateHandler extends InstrumentedHandler<TransitionOrderStateCommand, Order, AppError> {
  protected handlerName = 'TransitionOrderState'
  protected operationType = 'command' as const

  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventBus: IDomainEventBus
  ) {
    super()
  }

  protected async handle(command: TransitionOrderStateCommand): Promise<Result<Order, AppError>> {
    const allowedRoles = ROLE_PERMISSIONS[command.newState]
    if (allowedRoles && !allowedRoles.includes(command.performedByRole)) {
      return fail(AppError.forbidden(`Role '${command.performedByRole}' cannot transition to '${command.newState}'`))
    }

    const orderRes = await this.orderRepository.findById(new UniqueEntityID(command.orderId))
    if (orderRes.isFailure()) return orderRes
    
    const order = orderRes.unwrap()
    if (!order) return fail(AppError.notFound('Order', command.orderId))

    const transitionResult = this.executeTransition(order, command.newState as OrderState, command.reason)
    if (transitionResult.isFailure()) return transitionResult

    const saveResult = await this.orderRepository.save(order)
    if (saveResult.isFailure()) return saveResult

    const events = order.pullDomainEvents()
    if (events.length > 0) {
      const transportEvents = events.map(e => e.toJSON() as any);
      await this.eventBus.publishAll(transportEvents)
    }

    metricsCollector.recordStateTransition(command.newState, command.performedByRole)

    return ok(order)
  }

  private executeTransition(order: Order, newState: OrderState, reason?: string): Result<void, AppError> {
    let result: Result<void, string>;
    
    switch (newState) {
      case 'QUOTATION_APPROVED': result = order.approveQuotation(); break;
      case 'PAYMENT_RECEIVED': result = order.confirmPayment(); break;
      case 'IN_PRODUCTION': result = order.startProduction(); break;
      case 'DELIVERED': result = order.markAsDelivered(); break;
      case 'COMPLETED': result = order.complete(); break;
      case 'CANCELLED':
        if (!reason) return fail(AppError.validation('Razón requerida para cancelación'))
        result = order.cancel(reason); break;
      default: result = order.transition(newState); break;
    }

    if (result.isFailure()) {
        return fail(AppError.business(result.getError()))
    }
    return ok(undefined)
  }

  protected extractSpanAttributes(command: TransitionOrderStateCommand) {
    return {
      'order.id': command.orderId,
      'order.target_state': command.newState,
      'order.role': command.performedByRole
    }
  }
}
