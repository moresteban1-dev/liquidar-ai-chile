import { SupabaseEventPublisher } from '@/infrastructure/events/SupabaseEventPublisher'
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger'
import { DomainEvent } from '@/core/shared/DomainEvent'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('SupabaseEventPublisher Integration', () => {
  let mockSupabase: any
  let logger: StructuredLogger
  let eventPublisher: SupabaseEventPublisher

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null })
    }

    logger = StructuredLogger.create({ component: 'test' })
    eventPublisher = new SupabaseEventPublisher(mockSupabase, logger)
  })

  it('should persist event to outbox when published', async () => {
    class TestOrderUpdatedEvent extends DomainEvent {
      constructor(private readonly aggregateIdValue: UniqueEntityID) {
        super();
      }
      getAggregateId(): UniqueEntityID {
        return this.aggregateIdValue;
      }
    }

    const event = new TestOrderUpdatedEvent(new UniqueEntityID('order-123'));

    await eventPublisher.publish(event)

    expect(mockSupabase.from).toHaveBeenCalledWith('event_outbox')
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        event_type: 'TestOrderUpdatedEvent',
        aggregate_id: 'order-123'
      })
    ])
  })
})
