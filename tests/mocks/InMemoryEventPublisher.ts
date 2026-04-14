import { IEventPublisher } from '@/core/application/ports/IEventPublisher';
import { DomainEvent } from '@/core/shared/domain/events/DomainEvent';
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

  async publishAll(events: any[]): Promise<void> {
    this.events.push(...events);
  }

  // ── Test Helpers ──

  get publishedEvents(): DomainEvent[] {
    return [...this.events];
  }

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
