import { NextRequest } from 'next/server';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';
import { ok } from '@/infrastructure/http/helpers/responses';
import { getContainer, DI_KEYS } from '@/infrastructure/di/Container';
import { CacheManager } from '@/infrastructure/cache/CacheManager';

/**
 * Returns current system health metrics for monitoring during load tests.
 * Polled by the load test dashboard.
 */
export const GET = adminRoute(async (_req: NextRequest, _ctx: MiddlewareContext) => {
  const container = await getContainer(); // FIX: Await getContainer
  const cache = await container.resolve<CacheManager>(DI_KEYS.CacheManager); // FIX: Await resolve
  const supabase = await container.resolve<any>(DI_KEYS.SupabaseClient); // FIX: Await resolve

  // @ts-ignore - Assuming getStats exists on CacheManager
  const cacheStats = typeof cache.getStats === 'function' ? cache.getStats() : { size: 0, hitRate: 0, hits: 0, misses: 0, evictions: 0, memoryEstimateBytes: 0 };

  // DB connection check
  const dbStart = Date.now();
  const { error: dbError } = await supabase.from('orders').select('id', { count: 'exact', head: true });
  const dbLatency = Date.now() - dbStart;

  // Memory usage (Node.js)
  const memUsage = process.memoryUsage();

  return ok({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbError ? 'error' : 'healthy',
      latencyMs: dbLatency,
      error: dbError?.message ?? null,
    },
    cache: {
      size: cacheStats.size,
      hitRate: Math.round((cacheStats.hitRate || 0) * 100 * 100) / 100,
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      evictions: cacheStats.evictions,
      memoryMB: Math.round((cacheStats.memoryEstimateBytes || 0) / 1024 / 1024 * 100) / 100,
    },
    memory: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      rssMB: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      externalMB: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
    },
  });
});
