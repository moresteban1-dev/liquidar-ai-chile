import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventProcessor, EventHandler } from './EventProcessor'

describe('EventProcessor', () => {
  let processor: EventProcessor
  let mockClient: any

  const createChainableMock = (resolveFn: (...args: any[]) => any) => {
    const chain: any = {};
    const self = () => chain;
    chain.from = vi.fn().mockImplementation(self);
    chain.select = vi.fn().mockImplementation(self);
    chain.eq = vi.fn().mockImplementation(self);
    chain.lt = vi.fn().mockImplementation(self);
    chain.order = vi.fn().mockImplementation(self);
    chain.limit = vi.fn().mockImplementation(resolveFn);
    chain.update = vi.fn().mockImplementation(self);
    chain.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    return chain;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  })

  it('should process events and call handlers', async () => {
    // limit resolves with data first, then eq (from update) resolves with success
    mockClient = createChainableMock(() => Promise.resolve({
      data: [{ id: 'ev-1', event_type: 'OrderCreated', aggregate_id: 'ord-1', payload: { foo: 'bar' }, retry_count: 0 }],
      error: null
    }));
    // Override eq specifically for the update chain to avoid returning the data array
    mockClient.eq = vi.fn()
      .mockImplementationOnce(() => mockClient) // eq in select chain
      .mockImplementationOnce(() => Promise.resolve({ error: null })); // eq in update chain
    
    processor = new EventProcessor(mockClient)

    const handler: EventHandler = { eventType: 'OrderCreated', handle: vi.fn().mockResolvedValue(undefined) }
    processor.on('OrderCreated', handler)

    const result = await processor.processAll()
    
    expect(handler.handle).toHaveBeenCalledWith({ foo: 'bar' })
    expect(result.processed).toBe(1)
  })

  it('should skip events without handlers', async () => {
    mockClient = createChainableMock(() => Promise.resolve({
      data: [{ id: 'ev-2', event_type: 'Unknown', aggregate_id: 'ord-2', payload: {}, retry_count: 0 }],
      error: null
    }));
    processor = new EventProcessor(mockClient)

    const result = await processor.processAll()
    expect(result.skipped).toBe(1)
  })
})
