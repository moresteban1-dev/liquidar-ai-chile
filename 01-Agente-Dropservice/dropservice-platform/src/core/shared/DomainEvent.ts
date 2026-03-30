import { UniqueEntityID } from './UniqueEntityID'
import { crypto } from '@/lib/shared/crypto';

export interface IDomainEvent {
  dateTimeOccurred: Date
  version: number
  getAggregateId(): UniqueEntityID
}

export abstract class DomainEvent implements IDomainEvent {
  public readonly dateTimeOccurred: Date;
  public readonly eventId: string;
  public version: number = 0;

  constructor() {
    this.dateTimeOccurred = new Date();
    this.eventId = crypto.randomUUID();
  }

  get id(): string {
    return this.eventId;
  }

  get type(): string {
    return this.constructor.name;
  }

  public abstract getAggregateId(): UniqueEntityID;

  /**
   * Serializes the event for storage in JSONB
   */
  public toJSON(): Record<string, unknown> {
    const { dateTimeOccurred, eventId, version, ...rest } = this as unknown as Record<string, unknown>;
    return {
      eventId,
      aggregateId: this.getAggregateId().toString(),
      eventType: this.type,
      version,
      occurredAt: dateTimeOccurred,
      payload: rest
    };
  }
}
