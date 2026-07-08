import { CacheManager, CacheTTL } from './CacheManager';
import { CacheKeys } from './CacheKeyBuilder';
import { IOrderRepository } from '@app/ports/IOrderRepository';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';

/**
 * Warms critical caches on application startup.
 * Prevents cold-start latency for the most accessed endpoints.
 */
export class CacheWarmer {
  private readonly cache: CacheManager;
  private readonly orderRepo: IOrderRepository;
  private readonly logger: StructuredLogger;

  constructor(deps: {
    cache: CacheManager;
    orderRepository: IOrderRepository;
    logger: StructuredLogger;
  }) {
    this.cache = deps.cache;
    this.orderRepo = deps.orderRepository;
    this.logger = deps.logger.child({ component: 'CacheWarmer' });
  }

  /**
   * Warm all critical caches. Called once on startup.
   */
  async warmAll(): Promise<{ warmed: number; failed: number; durationMs: number }> {
    const startTime = Date.now();
    let warmed = 0;
    let failed = 0;

    this.logger.info('Cache warming started');

    // ── 1. Dashboard Stats ──
    try {
      const statsResult = await this.orderRepo.getDashboardStats();
      if (statsResult.isSuccess()) {
        this.cache.set(CacheKeys.dashboardStats(), statsResult.value, {
          ttlMs: CacheTTL.MEDIUM,
          tags: ['dashboard'],
        });
        warmed++;
      } else {
        this.logger.error('Failed to warm dashboard stats', new Error(statsResult.getError().message));
        failed++;
      }
    } catch (error: unknown) {
      this.logger.error('Unexpected error warming dashboard stats', error);
      failed++;
    }

    // ── 2. Recent Orders (admin view, page 1) ──
    try {
      const recentOrdersResult = await this.orderRepo.findAllEnriched({
        page: 1,
        limit: 20,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      if (recentOrdersResult.isSuccess()) {
        const key = CacheKeys.orderList('admin', 'all', {
          page: 1,
          limit: 20,
          sortBy: 'created_at',
          sortOrder: 'desc',
        });

        this.cache.set(key, recentOrdersResult.value, {
          ttlMs: CacheTTL.SHORT,
          tags: ['orders:list', 'admin'],
        });
        warmed++;
      } else {
        this.logger.error('Failed to warm recent orders', new Error(recentOrdersResult.getError().message));
        failed++;
      }
    } catch (error: unknown) {
      this.logger.error('Unexpected error warming recent orders', error);
      failed++;
    }

    const durationMs = Date.now() - startTime;

    this.logger.info('Cache warming completed', {
      warmed,
      failed,
      durationMs,
    });

    return { warmed, failed, durationMs };
  }
}
