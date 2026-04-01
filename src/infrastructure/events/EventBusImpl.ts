import type { DomainEvent } from '@core/domain/events/DomainEvent';
import type { EventBus, EventHandler } from '@core/application/ports/EventBus';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

export class EventBusImpl implements EventBus {
    private handlers = new Map<string, EventHandler<any>[]>();

    private deadLetterQueue: Array<{ event: DomainEvent; error: Error; timestamp: Date }> = [];

    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
        const existing = this.handlers.get(eventType) ?? [];
        existing.push(handler);
        this.handlers.set(eventType, existing);

        logger.info(`Event handler registered for: ${eventType}`, {
            totalHandlers: existing.length,
        });
    }

    async publish(event: DomainEvent): Promise<void> {
        const handlers = this.handlers.get(event.type) ?? [];

        if (handlers.length === 0) {
            logger.warn(`No handlers for event: ${event.type}`, { eventId: event.id });
            return;
        }

        // Execute handlers in parallel with fault isolation
        const results = await Promise.allSettled(
            handlers.map(handler => handler.handle(event))
        );

        // Record failures without affecting other handlers
        for (const [index, result] of results.entries()) {
            if (result.status === 'rejected') {
                const error = result.reason instanceof Error
                    ? result.reason
                    : new Error(String(result.reason));

                logger.error(`Event handler failed for ${event.type}`, error, {
                    handlerIndex: index,
                    eventId: event.id,
                });

                this.deadLetterQueue.push({
                    event,
                    error,
                    timestamp: new Date(),
                });
            }
        }
    }

    async publishAll(events: DomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.publish(event);
        }
    }

    getDeadLetterQueue() {
        return [...this.deadLetterQueue];
    }

    async retryDeadLetters(): Promise<number> {
        let retried = 0;
        const queue = [...this.deadLetterQueue];
        this.deadLetterQueue = [];

        for (const item of queue) {
            try {
                await this.publish(item.event);
                retried++;
            } catch {
                this.deadLetterQueue.push(item);
            }
        }

        return retried;
    }
}
