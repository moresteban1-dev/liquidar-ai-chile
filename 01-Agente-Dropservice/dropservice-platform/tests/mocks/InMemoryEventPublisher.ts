import { IEventPublisher } from '@/core/application/ports/events/IEventPublisher';
import { DomainEvent } from '@/core/shared/DomainEvent';
import { Result } from '@/core/shared/Result';

export class InMemoryEventPublisher implements IEventPublisher {
  private events: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<Result<void, string>> {
    this.events.push(event);
    return Result.ok(undefined);
  }

  async publishMany(events: DomainEvent[]): Promise<Result<void, string>> {
    this.events.push(...events);
    return Result.ok(undefined);
  }

  // ── Test Helpers ──

  getPublishedEvents(): DomainEvent[] {
    return [...this.events];
  }

  getEventsByType(eventType: string): DomainEvent[] {
    return this.events.filter((e) => e.type === eventType);
  }

  get publishedCount(): number {
    return this.events.length;
  }

  hasEvent(eventType: string): boolean {
    return this.events.some((e) => e.type === eventType);
  }

  reset(): void {
    this.events = [];
  }
}
