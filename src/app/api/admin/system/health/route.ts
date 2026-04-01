import { NextRequest } from 'next/server';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';
import { ok } from '@/infrastructure/http/helpers/responses';
import { container } from '@/infrastructure/di/Container';
import { CacheManager } from '@/infrastructure/cache/CacheManager';

export interface SystemHealthReport {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly timestamp: string;
  readonly uptime: number;
  readonly version: string;
  readonly components: ComponentHealth[];
  readonly metrics: SystemMetrics;
}

interface ComponentHealth {
  readonly name: string;
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly latencyMs: number;
  readonly details?: Record<string, unknown>;
}

interface SystemMetrics {
  readonly memory: MemoryMetrics;
  readonly cache: CacheMetrics;
  readonly database: DatabaseMetrics;
  readonly notifications: NotificationMetrics;
  readonly events: EventMetrics;
}

interface MemoryMetrics {
  readonly heapUsedMB: number;
  readonly heapTotalMB: number;
  readonly rssMB: number;
  readonly heapUsagePercent: number;
}

interface CacheMetrics {
  readonly size: number;
  readonly hitRate: number;
  readonly memoryMB: number;
  readonly evictions: number;
}

interface DatabaseMetrics {
  readonly latencyMs: number;
  readonly activeConnections: number;
  readonly cacheHitRatio: number;
}

interface NotificationMetrics {
  readonly sent24h: number;
  readonly failed24h: number;
  readonly successRate: number;
}

interface EventMetrics {
  readonly pending: number;
  readonly processing: number;
  readonly dead: number;
}

export const GET = adminRoute(async (_req: NextRequest, ctx: MiddlewareContext) => {
  const startTime = Date.now();
  const c = container; // Using the exported container instance
  const supabase = await c.resolve<any>('supabase');
  const cache = await c.resolve<CacheManager>('cache');

  const components: ComponentHealth[] = [];

  // ── 1. Database Health ──
  let dbLatency = 0;
  let dbStatus: ComponentHealth['status'] = 'healthy';
  let dbDetails: Record<string, unknown> = {};

  try {
    const dbStart = Date.now();
    const { data: perfData } = await supabase.rpc('get_db_performance_summary');
    dbLatency = Date.now() - dbStart;

    if (dbLatency > 500) dbStatus = 'degraded';
    if (dbLatency > 2000) dbStatus = 'unhealthy';

    if (perfData) {
      for (const metric of perfData as any[]) {
        dbDetails[metric.metric_name] = {
          value: metric.metric_value,
          status: metric.status,
        };
      }
    }
  } catch (e) {
    dbStatus = 'unhealthy';
    dbDetails.error = e instanceof Error ? e.message : 'Unknown';
  }

  components.push({
    name: 'PostgreSQL',
    status: dbStatus,
    latencyMs: dbLatency,
    details: dbDetails,
  });

  // ── 2. Cache Health ──
  const cacheStats = cache.getStats();
  const cacheStatus: ComponentHealth['status'] =
    cacheStats.hitRate > 0.7 ? 'healthy' :
    cacheStats.hitRate > 0.4 ? 'degraded' : 'unhealthy';

  components.push({
    name: 'Cache',
    status: cacheStatus,
    latencyMs: 0,
    details: {
      size: cacheStats.size,
      hitRate: `${(cacheStats.hitRate * 100).toFixed(1)}%`,
      memoryMB: (cacheStats.memoryEstimateBytes / 1024 / 1024).toFixed(2),
      evictions: cacheStats.evictions,
    },
  });

  // ── 3. Notification System Health ──
  let notifStatus: ComponentHealth['status'] = 'healthy';
  let notifSent = 0;
  let notifFailed = 0;

  try {
    const since24h = new Date(Date.now() - 86400_000).toISOString();

    const { count: sentCount } = await supabase
      .from('notification_log')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('created_at', since24h);

    const { count: failedCount } = await supabase
      .from('notification_log')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', since24h);

    notifSent = sentCount ?? 0;
    notifFailed = failedCount ?? 0;

    const total = notifSent + notifFailed;
    const failRate = total > 0 ? notifFailed / total : 0;

    if (failRate > 0.1) notifStatus = 'unhealthy';
    else if (failRate > 0.02) notifStatus = 'degraded';
  } catch {
    notifStatus = 'degraded';
  }

  components.push({
    name: 'Notifications',
    status: notifStatus,
    latencyMs: 0,
    details: {
      sent24h: notifSent,
      failed24h: notifFailed,
      successRate: notifSent + notifFailed > 0
        ? `${((notifSent / (notifSent + notifFailed)) * 100).toFixed(1)}%`
        : 'N/A',
    },
  });

  // ── 4. Event Queue Health ──
  let evtPending = 0;
  let evtProcessing = 0;
  let evtDead = 0;
  let evtStatus: ComponentHealth['status'] = 'healthy';

  try {
    const { count: pending } = await supabase
      .from('event_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: processing } = await supabase
      .from('event_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing');

    const { count: dead } = await supabase
      .from('event_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'dead');

    evtPending = pending ?? 0;
    evtProcessing = processing ?? 0;
    evtDead = dead ?? 0;

    if (evtPending > 500) evtStatus = 'unhealthy';
    else if (evtPending > 100) evtStatus = 'degraded';
    if (evtDead > 10) evtStatus = 'degraded';
  } catch {
    evtStatus = 'degraded';
  }

  components.push({
    name: 'Event Queue',
    status: evtStatus,
    latencyMs: 0,
    details: { pending: evtPending, processing: evtProcessing, dead: evtDead },
  });

  // ── 5. Webhook Health ──
  let webhookStatus: ComponentHealth['status'] = 'healthy';

  try {
    const { count: unhealthyWebhooks } = await supabase
      .from('webhooks')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)
      .gt('failure_count', 10);

    if ((unhealthyWebhooks ?? 0) > 0) webhookStatus = 'degraded';
  } catch {
    webhookStatus = 'degraded';
  }

  components.push({
    name: 'Webhooks',
    status: webhookStatus,
    latencyMs: 0,
  });

  // ── Build Report ──
  const memUsage = process.memoryUsage();
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  const overallStatus: SystemHealthReport['status'] =
    components.some((c) => c.status === 'unhealthy') ? 'unhealthy' :
    components.some((c) => c.status === 'degraded') ? 'degraded' : 'healthy';

  const report: SystemHealthReport = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    version: (process.env as any)['APP_VERSION'] ?? '2.0.0',
    components,
    metrics: {
      memory: {
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
        rssMB: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
        heapUsagePercent: Math.round(heapPercent * 100) / 100,
      },
      cache: {
        size: cacheStats.size,
        hitRate: Math.round(cacheStats.hitRate * 100 * 100) / 100,
        memoryMB: Math.round(cacheStats.memoryEstimateBytes / 1024 / 1024 * 100) / 100,
        evictions: cacheStats.evictions,
      },
      database: {
        latencyMs: dbLatency,
        activeConnections: (dbDetails['active_connections'] as any)?.value ?? 0,
        cacheHitRatio: parseFloat((dbDetails['cache_hit_ratio'] as any)?.value ?? '0'),
      },
      notifications: {
        sent24h: notifSent,
        failed24h: notifFailed,
        successRate: notifSent + notifFailed > 0
          ? Math.round((notifSent / (notifSent + notifFailed)) * 100 * 100) / 100
          : 100,
      },
      events: {
        pending: evtPending,
        processing: evtProcessing,
        dead: evtDead,
      },
    },
  };

  ctx.logger.info('System health check completed', {
    status: overallStatus,
    durationMs: Date.now() - startTime,
  });

  return ok(report);
});
