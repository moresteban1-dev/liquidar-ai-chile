import { IDomainEvent } from '../events/DomainEvent';
import { Result } from '../shared/Result';

/**
 * Domain Port for Event Publishing (Outbox Pattern / BullMQ dispatch).
 * Ensures eventual consistency without coupling domain to Redis or messaging brokers.
 */
export interface IEventPublisher {
  publish(event: IDomainEvent): Promise<Result<void>>;
  publishBatch(events: ReadonlyArray<IDomainEvent>): Promise<Result<void>>;
}
