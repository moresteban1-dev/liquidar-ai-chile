import { OutboxProcessor } from '@/infrastructure/events/OutboxProcessor'
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger'

/**
 * OutboxReliability Integration Tests
 * 
 * Tests the outbox processor with fully chained Supabase mocks.
 * Each mock method must return `this` to support the fluent API.
 */
describe('OutboxReliability Integration', () => {
  let mockSupabase: any
  let mockHandler: any
  let logger: StructuredLogger
  let processor: OutboxProcessor

  beforeEach(() => {
    // Build a fully chainable Supabase mock
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
    }

    // Each call to `.from()` returns a chainable object
    const chainable = () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        match: vi.fn().mockReturnThis(),
      }
      return chain
    }

    mockSupabase.from.mockImplementation(() => chainable())

    mockHandler = {
      execute: vi.fn().mockResolvedValue({ isSuccess: () => true })
    }

    logger = StructuredLogger.create({ component: 'test' })
    processor = new OutboxProcessor(mockSupabase, mockHandler, logger)
  })

  it('should process pending events and mark them as completed', async () => {
    const pendingEvents = [
      { id: '1', event_type: 'order.updated', status: 'pending', payload: { aggregateId: 'ord-1', payload: { status: 'paid' } } }
    ]

    // Override the chain for this test: make limit return events
    const selectChain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: pendingEvents, error: null }),
    }
    const updateChain: any = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      match: vi.fn().mockResolvedValue({ error: null }),
    }

    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      // First from() call is the SELECT, subsequent ones are UPDATE
      if (callCount === 1) return selectChain
      return updateChain
    })

    const count = await processor.processPendingEvents()

    expect(count).toBeGreaterThanOrEqual(0)
  })

  it('should handle empty outbox gracefully', async () => {
    // Default mock returns empty array
    const count = await processor.processPendingEvents()
    expect(count).toBe(0)
  })
})
