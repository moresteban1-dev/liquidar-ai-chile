import { DomainEvent } from '@core/shared/DomainEvent';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { OrderState } from '../aggregates/order/OrderState';

/**
 * OrderStateChanged Event
 */
export class OrderStateChanged extends DomainEvent {
  constructor(
    public readonly aggregateId: UniqueEntityID,
    public readonly fromState: OrderState,
    public readonly toState: OrderState,
    public readonly reason?: string
  ) {
    super();
  }

  public getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
