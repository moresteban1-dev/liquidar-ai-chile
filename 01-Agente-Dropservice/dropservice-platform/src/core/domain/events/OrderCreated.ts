import { DomainEvent } from '@core/shared/DomainEvent';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

/**
 * OrderCreated Event
 */
export class OrderCreated extends DomainEvent {
  constructor(
    public readonly aggregateId: UniqueEntityID,
    public readonly clientId: UniqueEntityID,
    public readonly eventDate: Date
  ) {
    super();
  }

  public getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
