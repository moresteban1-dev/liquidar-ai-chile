import { Result, ok, fail } from '@/core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { IEventPublisher } from '@/core/application/ports/events/IEventPublisher'
import { Order } from '@/core/domain/aggregates/order/Order'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { CreateOrderCommand } from '../commands/CreateOrderCommand'
import { metricsCollector } from '@/infrastructure/telemetry/MetricsCollector'
import { AppError } from '@/core/shared/AppError'

export class CreateOrderHandler extends InstrumentedHandler<CreateOrderCommand, Order, AppError> {
  protected handlerName = 'CreateOrder'
  protected operationType = 'command' as const

  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly eventPublisher: IEventPublisher
  ) {
    super()
  }

  protected async handle(command: CreateOrderCommand): Promise<Result<Order, AppError>> {
    const eventDate = new Date(command.eventDate)
    if (isNaN(eventDate.getTime())) {
      return fail(AppError.validation('Invalid event date format'))
    }

    const orderResult = Order.create({
      clientId: new UniqueEntityID(command.clientId),
      state: 'QUOTATION_PENDING',
      eventDate,
      eventType: command.eventType,
      estimatedGuests: command.estimatedGuests,
      deliveryAddress: command.deliveryAddress,
      specialInstructions: command.specialInstructions,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    if (orderResult.isFailure()) {
        // Domain errors are usually strings or structured, convert to AppError
        return fail(AppError.business(orderResult.getError() as string))
    }
    
    const order = orderResult.unwrap()

    const saveResult = await this.orderRepository.save(order)
    if (saveResult.isFailure()) return saveResult

    const events = order.pullDomainEvents()
    if (events.length > 0) {
      await this.eventPublisher.publishMany(events)
    }

    metricsCollector.recordOrderCreated({
      clientId: command.clientId,
      eventType: command.eventType || 'unknown'
    })

    return ok(order)
  }

  protected extractSpanAttributes(command: CreateOrderCommand) {
    return {
      'order.client_id': command.clientId,
      'order.event_type': command.eventType || 'unknown'
    }
  }
}
