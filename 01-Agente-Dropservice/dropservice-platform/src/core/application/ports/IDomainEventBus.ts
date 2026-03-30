import { Result } from '@shared/Result';

export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

export interface IDomainEventBus {
  publish(event: DomainEvent): Promise<Result<void, string>>;
  publishAll(events: DomainEvent[]): Promise<Result<void, string>>;
  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): void;
}
