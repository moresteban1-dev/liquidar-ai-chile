/**
 * Generic DataLoader for batching and caching database lookups.
 * 
 * Inspired by Facebook's DataLoader but adapted for:
 * - Server-side Next.js (request-scoped, no long-lived cache)
 * - Supabase (PostgREST queries, not GraphQL)
 * - Edge Runtime compatible (no Node.js-specific APIs)
 * 
 * Usage:
 *   const loader = new DataLoader(async (ids) => {
 *     const { data } = await supabase.from('users').select('*').in('id', ids);
 *     return new Map(data.map(u => [u.id, u]));
 *   });
 * 
 *   // These two calls are batched into a single DB query
 *   const [user1, user2] = await Promise.all([
 *     loader.load('id-1'),
 *     loader.load('id-2'),
 *   ]);
 */

export interface DataLoaderOptions {
  /** Max keys to batch in a single call (default: 100) */
  readonly maxBatchSize?: number;
  /** Time window in ms to collect keys before flushing (default: 5) */
  readonly batchWindowMs?: number;
  /** Enable per-request caching (default: true) */
  readonly cache?: boolean;
}

type BatchFunction<K, V> = (keys: K[]) => Promise<Map<K, V>>;

interface PendingRequest<V> {
  resolve: (value: V | null) => void;
  reject: (error: Error) => void;
}

export class DataLoader<K, V> {
  private readonly batchFn: BatchFunction<K, V>;
  private readonly maxBatchSize: number;
  private readonly batchWindowMs: number;
  private readonly cacheEnabled: boolean;

  // Per-request cache
  private cache: Map<K, V | null> = new Map();

  // Pending batch
  private pendingKeys: Map<K, PendingRequest<V>[]> = new Map();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private batchCount = 0;

  constructor(
    batchFn: BatchFunction<K, V>,
    options: DataLoaderOptions = {},
  ) {
    this.batchFn = batchFn;
    this.maxBatchSize = options.maxBatchSize ?? 100;
    this.batchWindowMs = options.batchWindowMs ?? 5;
    this.cacheEnabled = options.cache ?? true;
  }

  /**
   * Load a single value by key.
   * Multiple calls within the batch window are coalesced.
   */
  async load(key: K): Promise<V | null> {
    // Check cache first
    if (this.cacheEnabled && this.cache.has(key)) {
      return this.cache.get(key) ?? null;
    }

    return new Promise<V | null>((resolve, reject) => {
      if (!this.pendingKeys.has(key)) {
        this.pendingKeys.set(key, []);
      }
      this.pendingKeys.get(key)!.push({ resolve, reject });

      // Flush immediately if batch is full
      if (this.pendingKeys.size >= this.maxBatchSize) {
        this.flush();
      } else if (!this.flushTimer) {
        // Schedule flush after window
        this.flushTimer = setTimeout(() => this.flush(), this.batchWindowMs);
      }
    });
  }

  /**
   * Load multiple values by keys.
   * All keys are batched into a single query.
   */
  async loadMany(keys: K[]): Promise<(V | null)[]> {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  /**
   * Prime the cache with a known value.
   * Useful after a write operation.
   */
  prime(key: K, value: V): void {
    if (this.cacheEnabled) {
      this.cache.set(key, value);
    }
  }

  /**
   * Clear the cache for a specific key.
   */
  invalidate(key: K): void {
    this.cache.delete(key);
  }

  /**
   * Clear the entire cache.
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get statistics for debugging.
   */
  get stats(): { cacheSize: number; batchCount: number; pendingKeys: number } {
    return {
      cacheSize: this.cache.size,
      batchCount: this.batchCount,
      pendingKeys: this.pendingKeys.size,
    };
  }

  // ── Private ──────────────────────────────────────────

  private async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Snapshot current batch
    const currentBatch = new Map(this.pendingKeys);
    this.pendingKeys.clear();

    if (currentBatch.size === 0) return;

    this.batchCount++;
    const keys = Array.from(currentBatch.keys());

    try {
      // Execute batch query
      const results = await this.batchFn(keys);

      // Resolve all pending promises
      for (const [key, callbacks] of currentBatch) {
        const value = results.get(key) ?? null;

        // Cache the result
        if (this.cacheEnabled) {
          this.cache.set(key, value);
        }

        for (const cb of callbacks) {
          cb.resolve(value);
        }
      }
    } catch (error) {
      // Reject all pending promises
      const err = error instanceof Error ? error : new Error(String(error));
      for (const callbacks of currentBatch.values()) {
        for (const cb of callbacks) {
          cb.reject(err);
        }
      }
    }
  }
}
