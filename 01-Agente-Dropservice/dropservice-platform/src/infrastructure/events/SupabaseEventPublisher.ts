import { SupabaseClient } from '@supabase/supabase-js'
import { DomainEvent } from '@/core/shared/DomainEvent'
import { IEventPublisher } from '@/core/application/ports/IEventPublisher'
import { Result, Success, Failure } from '@/core/shared/Result'
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger'

/**
 * SupabaseEventPublisher
 * 
 * Implements the Outbox pattern for reliable event delivery.
 */
export class SupabaseEventPublisher implements IEventPublisher {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: StructuredLogger
  ) {}

  async publish(event: DomainEvent): Promise<Result<void, string>> {
    return await this.publishMany([event])
  }

  async publishMany(events: DomainEvent[]): Promise<Result<void, string>> {
    if (events.length === 0) return new Success(undefined)

    this.logger.info(`Persisting ${events.length} events to outbox`)

    const records = events.map(event => ({
      event_type: event.type,
      aggregate_id: event.getAggregateId().toString(),
      payload: event.toJSON(),
      status: 'pending'
    }))

    const { error } = await this.supabase
      .from('event_outbox')
      .insert(records)

    if (error) {
      this.logger.error('Failed to insert events into outbox', error as any)
      return new Failure(`Outbox error: ${error.message}`)
    }
    
    return new Success(undefined)
  }
}
