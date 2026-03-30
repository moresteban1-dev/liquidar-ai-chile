import { CacheManager } from '@/infrastructure/cache/CacheManager';

describe('Cache Performance Benchmarks', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({ child: () => ({ info: () => {}, debug: () => {}, error: () => {} }) } as any, { recordCounter: () => {} } as any, {
      maxEntries: 100_000,
    });
  });

  it('should handle high throughput writes', () => {
    const start = performance.now();
    const count = 10_000;
    
    for (let i = 0; i < count; i++) {
      cache.set(`key-${i}`, { data: 'some-value-' + i });
    }
    
    const duration = performance.now() - start;
    console.log(`Throughput: ${Math.round(count / (duration / 1000))} ops/sec (${Math.round(duration)}ms)`);
    
    expect(duration).toBeLessThan(100); // Should be very fast
    expect(cache.getStats().size).toBe(count);
  });

  it('should handle extremely low latency reads', () => {
    for (let i = 0; i < 1000; i++) {
      cache.set(`key-${i}`, 'value');
    }

    const start = performance.now();
    const count = 100_000;
    
    for (let i = 0; i < count; i++) {
      cache.get(`key-${i % 1000}`);
    }
    
    const duration = performance.now() - start;
    console.log(`Read latency: ${Math.round((duration / count) * 1000) / 1000}ms per op (${Math.round(duration)}ms total)`);
    
    expect(duration).toBeLessThan(50); // Reads should be near-instant
  });

  it('should scale prefix invalidation linearly', () => {
    const prefix = 'orders:client-1:';
    for (let i = 0; i < 5000; i++) {
      cache.set(`${prefix}${i}`, 'data');
    }
    for (let i = 0; i < 5000; i++) {
      cache.set(`other:${i}`, 'data');
    }

    const start = performance.now();
    const invalidated = cache.invalidateByPrefix(prefix);
    const duration = performance.now() - start;

    console.log(`Invalidation: ${invalidated} entries in ${Math.round(duration)}ms`);
    
    expect(invalidated).toBe(5000);
    expect(duration).toBeLessThan(20);
  });
});
