/**
 * EventBus Port
 * 
 * Defines the contract for publishing and subscribing to domain events.
 */
import { DomainEvent } from '@core/domain/events/DomainEvent';

export type EventHandler<T extends DomainEvent = DomainEvent> = {
    handle(event: T): Promise<void>;
};

export interface EventBus {
    publish(event: DomainEvent): Promise<void>;
    publishAll(events: DomainEvent[]): Promise<void>;
    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
}
