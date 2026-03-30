import { DataLoader } from '@infrastructure/persistence/DataLoader';

describe('DataLoader Performance Benchmarks', () => {
  it('should demonstrate latency reduction by batching', async () => {
    // Simulated DB latency
    const DB_LATENCY_MS = 50;
    
    const batchFn = vi.fn(async (keys: string[]) => {
      await new Promise(resolve => setTimeout(resolve, DB_LATENCY_MS));
      const result = new Map<string, string>();
      keys.forEach(key => result.set(key, `data-${key}`));
      return result;
    });

    const loader = new DataLoader(batchFn, { batchWindowMs: 5 });

    const startTime = Date.now();

    // Load 50 items concurrently
    const keys = Array.from({ length: 50 }, (_, i) => `id-${i}`);
    const results = await Promise.all(keys.map(key => loader.load(key)));

    const duration = Date.now() - startTime;

    // Without batching, 50 serial requests would take 50 * 50ms = 2500ms
    // With batching, it should take roughly DB_LATENCY_MS + batchWindowMs (~55ms)
    
    expect(results).toHaveLength(50);
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(duration).toBeLessThan(150); // Allow some overhead but way less than 2500ms
    console.log(`DataLoader Batch Duration: ${duration}ms (vs ~2500ms serial)`);
  });

  it('should demonstrate cache efficiency', async () => {
    const batchFn = vi.fn(async (keys: string[]) => {
      const result = new Map<string, string>();
      keys.forEach(key => result.set(key, `data-${key}`));
      return result;
    });

    const loader = new DataLoader(batchFn);

    // Warm up cache
    await loader.load('user-1');
    expect(batchFn).toHaveBeenCalledTimes(1);

    // Subsequent loads should be instant (0ms latency, no DB call)
    const startTime = Date.now();
    for(let i=0; i<100; i++) {
      await loader.load('user-1');
    }
    const duration = Date.now() - startTime;

    expect(batchFn).toHaveBeenCalledTimes(1); 
    expect(duration).toBeLessThan(10);
    console.log(`DataLoader Cache Duration (100 hits): ${duration}ms`);
  });
});
