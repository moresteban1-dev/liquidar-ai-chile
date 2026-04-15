import { IEventPublisher } from '@/core/application/ports/IEventPublisher';
import { DomainEvent } from '@/core/shared/DomainEvent';
import { Result, ok } from '@/core/shared/Result';

export class InMemoryEventPublisher implements IEventPublisher {
  public publishedEvents: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<Result<void, string>> {
    this.publishedEvents.push(event);
    return ok(undefined);
  }

  async publishMany(events: DomainEvent[]): Promise<Result<void, string>> {
    this.publishedEvents.push(...events);
    return ok(undefined);
  }

  async publishAll(events: any[]): Promise<Result<void, string>> {
    this.publishedEvents.push(...events);
    return ok(undefined);
  }

  clear() {
    this.publishedEvents = [];
  }
}
