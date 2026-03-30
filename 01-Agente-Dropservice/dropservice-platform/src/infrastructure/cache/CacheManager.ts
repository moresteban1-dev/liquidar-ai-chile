import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { MetricsCollector } from '@/infrastructure/telemetry/MetricsCollector';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
  readonly createdAt: number;
  readonly tags: string[];
}

export interface CacheOptions {
  /** Time-to-live in milliseconds */
  readonly ttlMs: number;
  /** Tags for group invalidation */
  readonly tags?: string[];
}

export interface CacheStats {
  readonly size: number;
  readonly hits: number;
  readonly misses: number;
  readonly hitRate: number;
  readonly evictions: number;
  readonly invalidations: number;
  readonly memoryEstimateBytes: number;
}

export interface CacheConfig {
  /** Maximum number of entries (default: 10000) */
  readonly maxEntries?: number;
  /** Default TTL in ms (default: 60000 = 1 min) */
  readonly defaultTtlMs?: number;
  /** Cleanup interval in ms (default: 30000 = 30s) */
  readonly cleanupIntervalMs?: number;
  /** Enable metrics recording (default: true) */
  readonly enableMetrics?: boolean;
}

// ═══════════════════════════════════════════════════════════
// Pre-defined TTL Strategies
// ═══════════════════════════════════════════════════════════

export const CacheTTL = {
  /** 10 seconds — for rapidly changing data */
  VOLATILE: 10_000,
  /** 30 seconds — for semi-dynamic data */
  SHORT: 30_000,
  /** 1 minute — default for most reads */
  STANDARD: 60_000,
  /** 5 minutes — for moderately static data */
  MEDIUM: 300_000,
  /** 15 minutes — for catalog/config data */
  LONG: 900_000,
  /** 1 hour — for rarely changing reference data */
  EXTENDED: 3_600_000,
} as const;

// ═══════════════════════════════════════════════════════════
// Cache Manager
// ═══════════════════════════════════════════════════════════

export class CacheManager {
  private static instance: CacheManager | null = null;

  private readonly store: Map<string, CacheEntry<unknown>> = new Map();
  private readonly config: Required<CacheConfig>;
  private readonly logger: StructuredLogger;
  private readonly metrics: MetricsCollector;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  // Stats
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private invalidations = 0;

  constructor(
    logger: StructuredLogger,
    metrics: MetricsCollector,
    config: CacheConfig = {},
  ) {
    this.logger = logger.child({ component: 'CacheManager' });
    this.metrics = metrics;
    this.config = {
      maxEntries: config.maxEntries ?? 10_000,
      defaultTtlMs: config.defaultTtlMs ?? CacheTTL.STANDARD,
      cleanupIntervalMs: config.cleanupIntervalMs ?? 30_000,
      enableMetrics: config.enableMetrics ?? true,
    };

    // Start cleanup timer
    this.cleanupTimer = setInterval(
      () => this.cleanup(),
      this.config.cleanupIntervalMs,
    );

    this.logger.info('CacheManager initialized', {
      maxEntries: this.config.maxEntries,
      defaultTtlMs: this.config.defaultTtlMs,
    });
  }

  static getInstance(
    logger: StructuredLogger,
    metrics: MetricsCollector,
    config?: CacheConfig,
  ): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(logger, metrics, config);
    }
    return CacheManager.instance;
  }

  // ── Core Operations ──────────────────────────────────

  /**
   * Get a value from cache. Returns null on miss or expiry.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      this.recordMetric('cache.miss', key);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      // Expired — lazy eviction
      this.store.delete(key);
      this.misses++;
      this.evictions++;
      this.recordMetric('cache.miss', key);
      return null;
    }

    this.hits++;
    this.recordMetric('cache.hit', key);
    return entry.value as T;
  }

  /**
   * Set a value in cache with TTL and optional tags.
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const ttlMs = options?.ttlMs ?? this.config.defaultTtlMs;
    const tags = options?.tags ?? [];
    const now = Date.now();

    // Evict LRU if at capacity
    if (this.store.size >= this.config.maxEntries && !this.store.has(key)) {
      this.evictOldest();
    }

    this.store.set(key, {
      value,
      expiresAt: now + ttlMs,
      createdAt: now,
      tags,
    });
  }

  /**
   * Get-or-set pattern: returns cached value or computes and caches it.
   * This is the most common usage pattern.
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Delete a specific key from cache.
   */
  delete(key: string): boolean {
    const existed = this.store.delete(key);
    if (existed) {
      this.invalidations++;
    }
    return existed;
  }

  /**
   * Invalidate all entries matching a key prefix.
   * Example: invalidateByPrefix('orders:client:123') removes all
   * cached order lists for client 123.
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    this.invalidations += count;

    if (count > 0) {
      this.logger.debug('Cache invalidated by prefix', { prefix, count });
    }

    return count;
  }

  /**
   * Invalidate all entries with a specific tag.
   * Example: invalidateByTag('order:order-123') removes all cached
   * views containing order-123.
   */
  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.store) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
        count++;
      }
    }
    this.invalidations += count;

    if (count > 0) {
      this.logger.debug('Cache invalidated by tag', { tag, count });
    }

    return count;
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Clear all entries.
   */
  clear(): void {
    const size = this.store.size;
    this.store.clear();
    this.logger.info('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      evictions: this.evictions,
      invalidations: this.invalidations,
      memoryEstimateBytes: this.estimateMemory(),
    };
  }

  /**
   * Graceful shutdown.
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
    CacheManager.instance = null;
    this.logger.info('CacheManager destroyed');
  }

  // ── Private ──────────────────────────────────────────

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.evictions += cleaned;
      this.logger.debug('Cache cleanup', { removed: cleaned, remaining: this.store.size });
    }
  }

  private evictOldest(): void {
    // Find oldest entry by createdAt
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
      this.evictions++;
    }
  }

  private estimateMemory(): number {
    let estimate = 0;
    for (const [key, entry] of this.store) {
      // Rough estimation: key length + JSON serialized value
      estimate += key.length * 2; // UTF-16
      try {
        estimate += JSON.stringify(entry.value).length * 2;
      } catch {
        estimate += 500; // Fallback for circular references or complex objects
      }
      estimate += 100; // Overhead per entry (tags, timestamps)
    }
    return estimate;
  }

  private recordMetric(type: string, key: string): void {
    if (!this.config.enableMetrics) return;

    // Extract namespace from key (e.g., "orders:list:client-1" → "orders")
    const namespace = key.split(':')[0] ?? 'unknown';
    this.metrics.recordCounter(type, 1, { namespace });
  }
}
