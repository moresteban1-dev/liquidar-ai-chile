import { SupabaseClient } from '@supabase/supabase-js'
// [REMOVED] m
import { metricsCollector } from '@/infrastructure/telemetry/MetricsCollector'
import { withSpan } from '@/infrastructure/telemetry/Tracer'

export interface EventHandler {
  eventType: string
  handle(payload: Record<string, unknown>): Promise<void>
}

export class EventProcessor {
  private handlers = new Map<string, EventHandler[]>()

  constructor(private readonly client: SupabaseClient) {}

  public on(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || []
    existing.push(handler)
    this.handlers.set(eventType, existing)
  }

  public async processAll(batchSize: number = 50): Promise<{ processed: number; failed: number; skipped: number }> {
    return withSpan('EventProcessor.processAll', { 'batch.size': batchSize }, async (span) => {
      let processed = 0, failed = 0, skipped = 0

      const { data: events, error } = await this.client
        .from('domain_events')
        .select('*')
        .eq('processed', false)
        .lt('retry_count', 3)
        .order('occurred_at', { ascending: true })
        .limit(batchSize)

      if (error || !events) return { processed: 0, failed: 0, skipped: 0 }

      for (const event of events) {
        const handlers = this.handlers.get(event.event_type)
        if (!handlers) { skipped++; continue }

        try {
          for (const handler of handlers) {
            await withSpan(`EventHandler.${event.event_type}`, { 'event.id': event.id }, () => handler.handle(event.payload))
          }
          await this.client.from('domain_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('id', event.id)
          processed++
          metricsCollector.recordHandlerDuration(`event:${event.event_type}`, 0, true)
        } catch (err) {
          failed++
          await this.client.rpc('increment_retry_count', { event_id: event.id, error_msg: (err as Error).message })
          metricsCollector.recordHandlerError(`event:${event.event_type}`, (err as Error).message)
        }
      }

      span.setAttributes({ 'events.processed': processed, 'events.failed': failed, 'events.skipped': skipped })
      return { processed, failed, skipped }
    })
  }

  public async getStats() {
    const { data: pending } = await this.client.from('domain_events').select('id').eq('processed', false).lt('retry_count', 3)
    const { data: processed } = await this.client.from('domain_events').select('id').eq('processed', true)
    return { pending: pending?.length || 0, processed: processed?.length || 0 }
  }
}
