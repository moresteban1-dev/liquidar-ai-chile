import { CacheManager, CacheTTL } from '@/infrastructure/cache/CacheManager';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { MetricsCollector } from '@/infrastructure/telemetry/MetricsCollector';

describe('CacheManager', () => {
  let cache: CacheManager;
  let logger: StructuredLogger;
  let metrics: MetricsCollector;

  beforeEach(() => {
    logger = {
      child: vi.fn().mockReturnThis(),
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    } as any;

    metrics = {
      recordCounter: vi.fn(),
      recordHistogram: vi.fn(),
    } as any;

    cache = new CacheManager(logger, metrics, {
      maxEntries: 5,
      defaultTtlMs: 100,
      cleanupIntervalMs: 50,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for non-existent keys', () => {
    expect(cache.get('non-existent')).toBeNull();
  });

  it('should expire entries after TTL', async () => {
    cache.set('key1', 'value1', { ttlMs: 10 });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cache.get('key1')).toBeNull();
  });

  it('should evict oldest entry when at capacity', () => {
    cache.set('k1', 1);
    cache.set('k2', 2);
    cache.set('k3', 3);
    cache.set('k4', 4);
    cache.set('k5', 5);
    
    // Should be at capacity
    cache.set('k6', 6);
    
    expect(cache.store.size).toBe(5);
    expect(cache.get('k1')).toBeNull(); // k1 was oldest
    expect(cache.get('k6')).toBe(6);
  });

  it('should invalidate by prefix', () => {
    cache.set('user:1:profile', { name: 'Alice' });
    cache.set('user:1:orders', [1, 2]);
    cache.set('user:2:profile', { name: 'Bob' });

    const count = cache.invalidateByPrefix('user:1');
    expect(count).toBe(2);
    expect(cache.get('user:1:profile')).toBeNull();
    expect(cache.get('user:1:orders')).toBeNull();
    expect(cache.get('user:2:profile')).not.toBeNull();
  });

  it('should invalidate by tag', () => {
    cache.set('k1', 'v1', { ttlMs: 100, tags: ['tagA'] });
    cache.set('k2', 'v2', { ttlMs: 100, tags: ['tagA', 'tagB'] });
    cache.set('k3', 'v3', { ttlMs: 100, tags: ['tagB'] });

    const count = cache.invalidateByTag('tagA');
    expect(count).toBe(2);
    expect(cache.get('k1')).toBeNull();
    expect(cache.get('k2')).toBeNull();
    expect(cache.get('k3')).toBe('v3');
  });

  it('should provide accurate stats', () => {
    cache.set('k1', 'v1');
    cache.get('k1'); // hit
    cache.get('k2'); // miss
    
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });

  it('should use getOrSet correctly', async () => {
    const factory = vi.fn().mockResolvedValue('computed');
    
    const result1 = await cache.getOrSet('key', factory);
    expect(result1).toBe('computed');
    expect(factory).toHaveBeenCalledTimes(1);

    const result2 = await cache.getOrSet('key', factory);
    expect(result2).toBe('computed');
    expect(factory).toHaveBeenCalledTimes(1); // Should use cache
  });
});
