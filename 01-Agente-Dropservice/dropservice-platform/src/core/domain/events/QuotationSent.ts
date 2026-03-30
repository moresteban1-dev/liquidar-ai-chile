import { DomainEvent } from '@core/shared/DomainEvent';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

/**
 * QuotationSent Event
 */
export class QuotationSent extends DomainEvent {
  constructor(
    public readonly aggregateId: UniqueEntityID,
    public readonly orderId: UniqueEntityID,
    public readonly providerId: UniqueEntityID,
    public readonly finalPrice: number,
    public readonly currency: string
  ) {
    super();
  }

  public getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}
