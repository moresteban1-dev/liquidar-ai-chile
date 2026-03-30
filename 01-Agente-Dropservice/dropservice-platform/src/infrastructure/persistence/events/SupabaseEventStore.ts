import { EventStore } from '@core/application/ports/EventStore';
import { IDomainEvent } from '@core/shared/DomainEvent';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

export class SupabaseEventStore implements EventStore {
    private supabase = createServiceRoleClient();

    async appendEvents(aggregateId: string, events: IDomainEvent[], expectedVersion: number): Promise<Result<void, AppError>> {
        try {
            const eventData = events.map(e => {
                // Si el evento tiene toJSON, lo usamos, si no, lo construimos manualmente
                const json = (e as any).toJSON ? (e as any).toJSON() : {
                    aggregateId: (e as any).getAggregateId ? (e as any).getAggregateId().toString() : aggregateId,
                    eventType: (e as any).type || (e as any).constructor.name,
                    version: e.version,
                    occurredAt: e.dateTimeOccurred,
                    payload: e
                };

                return {
                    aggregate_id: aggregateId,
                    event_name: json.eventType || json.eventName,
                    version: json.version,
                    payload: json.payload || {},
                    metadata: json.metadata || {},
                    occurred_at: json.occurredAt || new Date().toISOString()
                };
            });

            const { error } = await this.supabase
                .from('domain_events')
                .insert(eventData);

            if (error) {
                if (error.code === '23505') { // Unique violation
                    return fail(new AppError('CONFLICT', `Concurrency conflict: Aggregate ${aggregateId} version ${expectedVersion} already exists.`, 409));
                }
                logger.error(`Failed to append events to store for ${aggregateId}`, error);
                return fail(AppError.internal(`Event Store Error: ${error.message}`));
            }

            logger.info(`Appended ${events.length} events to store for aggregate ${aggregateId}`);
            return ok(undefined);
        } catch (error) {
            return fail(AppError.from(error));
        }
    }

    async getEvents(aggregateId: string): Promise<Result<IDomainEvent[], AppError>> {
        try {
            const { data, error } = await this.supabase
                .from('domain_events')
                .select('*')
                .eq('aggregate_id', aggregateId)
                .order('version', { ascending: true });

            if (error) {
                logger.error(`Failed to fetch events for ${aggregateId}`, error);
                return fail(AppError.internal(`Event Store Error: ${error.message}`));
            }

            const events: IDomainEvent[] = (data || []).map(row => {
                return {
                    dateTimeOccurred: new Date(row.occurred_at),
                    version: row.version,
                    getAggregateId: () => new UniqueEntityID(row.aggregate_id),
                    // Atributos adicionales para compatibilidad
                    eventName: row.event_name,
                    payload: row.payload,
                    metadata: row.metadata,
                    toJSON: () => ({
                        eventId: row.id,
                        aggregateId: row.aggregate_id,
                        eventType: row.event_name,
                        version: row.version,
                        occurredAt: row.occurred_at,
                        payload: row.payload,
                        metadata: row.metadata
                    })
                } as unknown as IDomainEvent;
            });

            return ok(events);
        } catch (error) {
            return fail(AppError.from(error));
        }
    }
}
