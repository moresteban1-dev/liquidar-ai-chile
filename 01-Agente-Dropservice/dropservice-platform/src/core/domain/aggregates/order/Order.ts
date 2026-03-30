import { AggregateRoot } from '@core/shared/AggregateRoot';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { Result } from '@core/shared/Result';
import { Guard } from '@core/shared/Guard';
import { DomainEvent } from '@core/shared/DomainEvent';
import { OrderStateChanged } from '@core/domain/events/OrderStateChanged';
import { OrderCreated } from '@core/domain/events/OrderCreated';
import { QuotationPricing } from './QuotationPricing';
import { ERROR_MESSAGES } from '../../constants/ErrorMessages';

import { OrderState } from './OrderState';
export type { OrderState };

/**
 * OrderProps - Propiedades del Aggregate
 */
export interface OrderProps {
  clientId: UniqueEntityID
  providerId?: UniqueEntityID | undefined
  quotationId?: UniqueEntityID | undefined
  state: OrderState
  pricing?: QuotationPricing | undefined
  eventDate: Date
  eventType?: string | undefined
  estimatedGuests?: number | undefined
  deliveryAddress: string
  specialInstructions?: string | undefined
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | undefined
  cancelledAt?: Date | undefined
  cancellationReason?: string | undefined
  adminNotes?: string | undefined
}

/**
 * Order Aggregate Root
 */
export class Order extends AggregateRoot<OrderProps> {
  private constructor(props: OrderProps, id?: UniqueEntityID) {
    super(props, id)
  }

  public static create(props: OrderProps, id?: UniqueEntityID): Result<Order> {
    const guardResult = Guard.combine([
      Guard.againstNullOrUndefined(props.clientId, 'clientId'),
      Guard.againstNullOrUndefined(props.state, 'state'),
      Guard.againstNullOrUndefined(props.eventDate, 'eventDate'),
      Guard.againstNullOrUndefined(props.deliveryAddress, 'deliveryAddress')
    ])

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message!)
    }

    // BUG-001 Fix: Allow Today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDate = new Date(props.eventDate)
    eventDate.setHours(0, 0, 0, 0)

    if (eventDate < today) {
      return Result.fail(ERROR_MESSAGES.ORDER.FUTURE_DATE_REQD)
    }

    if (props.deliveryAddress.trim().length === 0) {
      return Result.fail(ERROR_MESSAGES.ORDER.EMPTY_ADDRESS)
    }

    const order = new Order(
      {
        ...props,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date()
      },
      id
    )

    order.addDomainEvent(new OrderCreated(
      order.id,
      order.props.clientId,
      order.props.eventDate
    ))

    return Result.ok(order)
  }

  public static reconstitute(props: OrderProps, id: string): Result<Order> {
    const orderId = id ? new UniqueEntityID(id) : undefined;
    return Result.ok(new Order(props, orderId));
  }

  protected applyEvent(_event: DomainEvent): void {}

  private static readonly STATE_TRANSITIONS: Record<OrderState, OrderState[]> = {
    DRAFT: ['QUOTATION_PENDING', 'CANCELLED'],
    QUOTATION_PENDING: ['QUOTATION_SENT', 'CANCELLED'],
    QUOTATION_SENT: ['QUOTATION_APPROVED', 'QUOTATION_PENDING', 'CANCELLED'],
    QUOTATION_APPROVED: ['PAYMENT_PENDING', 'CANCELLED'],
    PAYMENT_PENDING: ['PAYMENT_RECEIVED', 'CANCELLED'],
    PAYMENT_RECEIVED: ['IN_PRODUCTION', 'CANCELLED'],
    IN_PRODUCTION: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: []
  }

  public transition(newState: OrderState, reason?: string): Result<void> {
    const allowed = Order.STATE_TRANSITIONS[this.props.state] || []
    if (!allowed.includes(newState)) {
      return Result.fail(`${ERROR_MESSAGES.ORDER.INVALID_STATE_TRANSITION}: ${this.props.state} -> ${newState}`)
    }

    const oldState = this.props.state
    this.props.state = newState
    this.props.updatedAt = new Date()

    this.addDomainEvent(new OrderStateChanged(
      this.id,
      oldState,
      newState,
      reason
    ))

    if (newState === 'COMPLETED') {
      this.props.completedAt = new Date()
    }

    if (newState === 'CANCELLED') {
      this.props.cancelledAt = new Date()
      if (reason !== undefined) this.props.cancellationReason = reason
    }

    return Result.ok(undefined)
  }

  public approveQuotation(): Result<void> {
    return this.transition('QUOTATION_APPROVED')
  }

  public confirmPayment(): Result<void> {
    return this.transition('PAYMENT_RECEIVED')
  }

  public startProduction(): Result<void> {
    return this.transition('IN_PRODUCTION')
  }

  public markAsDelivered(): Result<void> {
    return this.transition('DELIVERED')
  }

  public complete(): Result<void> {
    return this.transition('COMPLETED')
  }

  public cancel(reason: string): Result<void> {
    return this.transition('CANCELLED', reason)
  }

  public assignProvider(providerId: UniqueEntityID): Result<void> {
    this.props.providerId = providerId
    this.props.updatedAt = new Date()
    return Result.ok(undefined)
  }

  public attachQuotation(quotationId: UniqueEntityID, pricing: QuotationPricing): Result<void> {
    this.props.quotationId = quotationId
    this.props.pricing = pricing
    this.props.updatedAt = new Date()
    return Result.ok(undefined)
  }

  // Getters
  get orderId(): UniqueEntityID { return this.id }
  get clientId(): UniqueEntityID { return this.props.clientId }
  get providerId(): UniqueEntityID | undefined { return this.props.providerId }
  get quotationId(): UniqueEntityID | undefined { return this.props.quotationId }
  get hasQuotation(): boolean { return this.props.quotationId !== undefined }
  get pricing(): QuotationPricing | undefined { return this.props.pricing }
  get state(): OrderState { return this.props.state }
  get eventDate(): Date { return this.props.eventDate }
  get deliveryAddress(): string { return this.props.deliveryAddress }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }
  get completedAt(): Date | undefined { return this.props.completedAt }
  get cancelledAt(): Date | undefined { return this.props.cancelledAt }
  get cancellationReason(): string | undefined { return this.props.cancellationReason }
  get isActive(): boolean { return this.props.state !== 'CANCELLED' && this.props.state !== 'COMPLETED' }

  get isPaid(): boolean {
    const paidStates: OrderState[] = ['PAYMENT_RECEIVED', 'IN_PRODUCTION', 'DELIVERED', 'COMPLETED']
    return paidStates.includes(this.props.state)
  }

  get daysUntilEvent(): number {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    if (!(this.props.eventDate instanceof Date) || isNaN(this.props.eventDate.getTime())) {
      return 0;
    }

    const event = new Date(this.props.eventDate)
    event.setHours(0, 0, 0, 0)
    const diffTime = event.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}
