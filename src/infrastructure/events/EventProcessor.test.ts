import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventProcessor, EventHandler } from './EventProcessor'

const mockClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
} as any

describe('EventProcessor', () => {
  let processor: EventProcessor

  beforeEach(() => {
    vi.clearAllMocks()
    processor = new EventProcessor(mockClient)
  })

  it('should process events and call handlers', async () => {
    const handler: EventHandler = { eventType: 'OrderCreated', handle: vi.fn().mockResolvedValue(undefined) }
    processor.on('OrderCreated', handler)

    mockClient.limit.mockResolvedValueOnce({
      data: [{ id: 'ev-1', event_type: 'OrderCreated', aggregate_id: 'ord-1', payload: { foo: 'bar' }, retry_count: 0 }],
      error: null
    })
    mockClient.eq.mockResolvedValueOnce({ error: null })

    const result = await processor.processAll()
    expect(handler.handle).toHaveBeenCalledWith({ foo: 'bar' })
    expect(result.processed).toBe(1)
  })

  it('should skip events without handlers', async () => {
    mockClient.limit.mockResolvedValueOnce({
      data: [{ id: 'ev-2', event_type: 'Unknown', aggregate_id: 'ord-2', payload: {}, retry_count: 0 }],
      error: null
    })
    const result = await processor.processAll()
    expect(result.skipped).toBe(1)
  })
})
