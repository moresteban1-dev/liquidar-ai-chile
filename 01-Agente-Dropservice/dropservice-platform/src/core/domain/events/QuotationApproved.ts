import { DomainEvent } from '@core/shared/DomainEvent';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

/**
 * QuotationApproved Event
 */
export class QuotationApproved extends DomainEvent {
  constructor(
    public readonly aggregateId: UniqueEntityID,
    public readonly orderId: UniqueEntityID
  ) {
    super();
  }

  public getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
