import { SupabaseClient } from '@supabase/supabase-js'
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger'
import { withSpan } from '@/infrastructure/telemetry/Tracer'
import { NotifyClientOnOrderUpdateHandler } from '@/core/application/handlers/NotifyClientOnOrderUpdateHandler'

/**
 * OutboxProcessor
 * 
 * Periodically scans the 'event_outbox' for pending events
 * and attempts to process them using the appropriate handlers.
 */
export class OutboxProcessor {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly notificationHandler: NotifyClientOnOrderUpdateHandler,
    private readonly logger: StructuredLogger
  ) {
    this.logger = logger.child({ component: 'OutboxProcessor' })
  }

  async processPendingEvents(): Promise<number> {
    return withSpan('OutboxProcessor.processPendingEvents', {}, async () => {
      this.logger.info('Starting outbox processing cycle')

      // 1. Fetch pending events
      const { data: events, error } = await this.supabase
        .from('event_outbox')
        .select('*')
        .eq('status', 'pending')
        .limit(20)

      if (error) {
        this.logger.error('Failed to fetch pending events from outbox', { error })
        return 0
      }

      if (!events || events.length === 0) {
        this.logger.info('No pending events found in outbox')
        return 0
      }

      this.logger.info(`Found ${events.length} pending events to process`)
      let processedCount = 0

      for (const event of events) {
        try {
          // 2. Mark as processing
          await this.supabase
            .from('event_outbox')
            .update({ status: 'processing' })
            .eq('id', event.id)

          // 3. Dispatch to handler (simplification: only order updates for now)
          if (event.event_type === 'order.updated') {
            const payload = event.payload
            await this.notificationHandler.execute({
              orderId: payload.aggregateId,
              newStatus: payload.payload.status,
              clientName: payload.payload.clientName || 'Cliente',
              clientEmail: payload.payload.clientEmail || '',
              total: payload.payload.total || 0
            })
          }

          // 4. Mark as completed
          await this.supabase
            .from('event_outbox')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', event.id)

          processedCount++
        } catch (error) {
          const retryCount = (event.retry_count || 0) + 1
          this.logger.error(`Error processing event ${event.id}`, { error, retryCount })

          await this.supabase
            .from('event_outbox')
            .update({ 
              status: retryCount > 5 ? 'failed' : 'pending',
              retry_count: retryCount,
              last_error: String(error)
            })
            .eq('id', event.id)
        }
      }

      return processedCount
    })
  }
}
