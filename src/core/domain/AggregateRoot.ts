import { DomainEvent } from './events/DomainEvent';
import { Entity } from './Entity';

export abstract class AggregateRoot<T> extends Entity<T> {
    private _domainEvents: DomainEvent[] = [];
    private _version: number = -1; // -1 means new, 0+ means loaded from store

    get domainEvents(): DomainEvent[] {
        return this._domainEvents;
    }

    get version(): number {
        return this._version;
    }

    set version(v: number) {
        this._version = v;
    }

    /**
     * Records a new event and applies it to the aggregate state.
     */
    protected apply(event: DomainEvent): void {
        this.addDomainEvent(event);
        this.applyEvent(event);
    }

    /**
     * Logic to update state based on a specific event.
     * Must be implemented by specific aggregates.
     */
    protected abstract applyEvent(event: DomainEvent): void;

    /**
     * Reconstitutes the aggregate from a history of events.
     */
    public loadFromHistory(events: DomainEvent[]): void {
        events.forEach(event => {
            this.applyEvent(event);
            this._version = event.version;
        });
    }

    protected addDomainEvent(domainEvent: DomainEvent): void {
        domainEvent.version = this._version + 1;
        this._domainEvents.push(domainEvent);
    }

    public clearEvents(): void {
        this._domainEvents = [];
    }
}
