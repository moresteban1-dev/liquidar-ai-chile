import { Result } from '@shared/Result';
import type { IDomainEventBus, DomainEvent } from '@app/ports/IDomainEventBus';

export class DomainEventBus implements IDomainEventBus {
    private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();

    public subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
        const current = this.handlers.get(eventType) || [];
        this.handlers.set(eventType, [...current, handler]);
    }

    public async publish(event: DomainEvent): Promise<Result<void, string>> {
        const eventType = event.eventType || event.constructor.name;
        const handlers = this.handlers.get(eventType) || [];
        
        const results = await Promise.allSettled(
            handlers.map(handler => handler(event))
        );

        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            return Result.fail(`${failures.length} handlers failed for ${eventType}`);
        }

        return Result.ok(undefined);
    }

    public async publishAll(events: DomainEvent[]): Promise<Result<void, string>> {
        const errors: string[] = [];
        for (const event of events) {
            const result = await this.publish(event);
            if (result.isFailure()) {
                errors.push(result.getError());
            }
        }

        if (errors.length > 0) {
            return Result.fail(`Failed to publish ${errors.length} events: ${errors.join(', ')}`);
        }

        return Result.ok(undefined);
    }
}

export const domainEventBus = new DomainEventBus();
