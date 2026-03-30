import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/di/bindings'
import { DashboardCollector } from '@/infrastructure/telemetry/DashboardCollector'
import { alertEngine } from '@/infrastructure/telemetry/AlertEngine'
import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    logger.info('Alert check cron started')
    const client = container.resolve<SupabaseClient>('SupabaseClient')
    const collector = new DashboardCollector(client)
    const healthResult = await collector.collectServiceHealth()
    if (healthResult.isFailure()) return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 })

    const health = healthResult.value
    const metrics: Record<string, number> = {
      errorRate: health.api.errorRate,
      p95Latency: health.api.p95Latency,
      p99Latency: health.api.p99Latency,
      avgLatency: health.api.avgLatency,
      pendingEvents: health.events.pending,
      failedEvents: health.events.failed,
      memoryUsage: health.system.memoryUsage,
      totalRequests: health.api.totalRequests
    }

    const alertEvents = await alertEngine.evaluate(metrics)
    const activeAlerts = alertEngine.getActiveAlerts()

    logger.info('Alert check completed', {
      newAlerts: alertEvents.filter(e => e.status === 'firing').length,
      resolvedAlerts: alertEvents.filter(e => e.status === 'resolved').length,
      totalActive: activeAlerts.length
    })

    return NextResponse.json({ success: true, events: alertEvents, activeAlerts: activeAlerts.length, metrics, timestamp: new Date().toISOString() })
  } catch (error) {
    logger.error('Alert check failed', error as Error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
