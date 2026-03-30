import { DataLoader } from '../../../src/infrastructure/persistence/DataLoader';

describe('DataLoader', () => {
  let batchFn: any;
  let loader: DataLoader<string, string>;

  beforeEach(() => {
    // Mock batch function that returns a Map of id -> "value-id"
    batchFn = vi.fn(async (keys: string[]) => {
      const result = new Map<string, string>();
      keys.forEach((key) => result.set(key, `value-${key}`));
      return result;
    });

    loader = new DataLoader(batchFn, { batchWindowMs: 0 });
  });

  it('should batch multiple loads into a single call', async () => {
    const promise1 = loader.load('a');
    const promise2 = loader.load('b');
    const promise3 = loader.load('c');

    const results = await Promise.all([promise1, promise2, promise3]);

    expect(results).toEqual(['value-a', 'value-b', 'value-c']);
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('should cache results for subsequent loads', async () => {
    await loader.load('a');
    await loader.load('a');

    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(loader.stats.cacheSize).toBe(1);
  });

  it('should coalesce identical keys in the same batch', async () => {
    const promise1 = loader.load('a');
    const promise2 = loader.load('a');

    const [res1, res2] = await Promise.all([promise1, promise2]);

    expect(res1).toBe('value-a');
    expect(res2).toBe('value-a');
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith(['a']);
  });

  it('should handle batch function errors by rejecting all pending promises', async () => {
    const errorLoader = new DataLoader(async () => {
      throw new Error('Batch failed');
    }, { batchWindowMs: 0 });

    const promise1 = errorLoader.load('a');
    const promise2 = errorLoader.load('b');

    await expect(promise1).rejects.toThrow('Batch failed');
    await expect(promise2).rejects.toThrow('Batch failed');
  });

  it('should respect maxBatchSize and flush immediately', async () => {
    const smallLoader = new DataLoader(batchFn, { maxBatchSize: 2 });

    const promise1 = smallLoader.load('a');
    const promise2 = smallLoader.load('b'); // Should trigger flush
    const promise3 = smallLoader.load('c');

    await Promise.all([promise1, promise2]);
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith(['a', 'b']);

    await promise3;
    expect(batchFn).toHaveBeenCalledTimes(2);
  });

  it('should allow priming the cache', async () => {
    loader.prime('preloaded', 'manual-value');
    const result = await loader.load('preloaded');

    expect(result).toBe('manual-value');
    expect(batchFn).not.toHaveBeenCalled();
  });

  it('should allow invalidating specific keys', async () => {
    await loader.load('a');
    expect(batchFn).toHaveBeenCalledTimes(1);

    loader.invalidate('a');
    await loader.load('a');
    expect(batchFn).toHaveBeenCalledTimes(2);
  });
});
