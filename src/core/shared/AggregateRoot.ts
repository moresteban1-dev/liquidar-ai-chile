import { Entity } from './Entity'
import { DomainEvent } from './DomainEvent'

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = []
  private _version: number = -1

  get domainEvents(): DomainEvent[] {
    return this._domainEvents
  }

  get version(): number {
    return this._version
  }

  set version(v: number) {
    this._version = v
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent)
  }

  /**
   * Records a new event and applies it to the aggregate state.
   */
  protected apply(event: DomainEvent): void {
    this.addDomainEvent(event)
    this.applyEvent(event)
  }

  public clearEvents(): void {
    this._domainEvents = []
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents]
    this._domainEvents = []
    return events
  }

  /**
   * Logic to update state based on a specific event.
   * Must be implemented by specific aggregates for Event Sourcing or 
   * simple state notification.
   */
  // @ts-ignore - Some aggregates might not implement this yet
  protected abstract applyEvent(event: DomainEvent): void;
}
