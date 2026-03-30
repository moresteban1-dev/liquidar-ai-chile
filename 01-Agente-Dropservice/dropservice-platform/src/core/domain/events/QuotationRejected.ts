import { DomainEvent } from '@core/shared/DomainEvent'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'

/**
 * QuotationRejected Domain Event
 * 
 * Emitido cuando el cliente rechaza una cotización enviada.
 */
export class QuotationRejected extends DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly orderId: string,
    public readonly reason: string
  ) {
    super()
  }

  public getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.aggregateId)
  }

  public override toJSON(): Record<string, unknown> {
    const data = super.toJSON()
    return {
      ...data,
      orderId: this.orderId,
      reason: this.reason
    }
  }
}
