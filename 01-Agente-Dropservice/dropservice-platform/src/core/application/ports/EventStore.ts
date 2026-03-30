import { IDomainEvent } from '@core/shared/DomainEvent';
import { Result } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

/**
 * Specialized Port for persistent event storage.
 * Foundation for potentially transitioning to Event Sourcing.
 */
export interface EventStore {
    /**
     * Appends events to the aggregate history atomically.
     */
    appendEvents(aggregateId: string, events: IDomainEvent[], expectedVersion: number): Promise<Result<void, AppError>>;

    /**
     * Retrieves all events for a given aggregate.
     */
    getEvents(aggregateId: string): Promise<Result<IDomainEvent[], AppError>>;
}
