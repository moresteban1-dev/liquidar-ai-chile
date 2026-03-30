import { metricsCollector } from '@/infrastructure/telemetry/MetricsCollector'
import { logger as _logger, StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger'
import { withSpan } from '@/infrastructure/telemetry/Tracer'

export async function instrumentedQuery<T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const repoLogger = new StructuredLogger(`repo:${table}`)
  const startTime = performance.now()

  return withSpan(
    `db.${operation}.${table}`,
    {
      'db.operation': operation,
      'db.table': table,
      'db.system': 'postgresql'
    },
    async (span) => {
      try {
        const result = await queryFn()
        const duration = performance.now() - startTime
        metricsCollector.recordDbQuery(operation, table, duration, true)
        span.setAttributes({ 'db.duration_ms': duration, 'db.success': true })
        return result
      } catch (error) {
        const duration = performance.now() - startTime
        metricsCollector.recordDbQuery(operation, table, duration, false)
        span.setAttributes({ 'db.duration_ms': duration, 'db.success': false, 'db.error': (error as Error).message })
        repoLogger.error(`${operation} on ${table} failed`, error as Error, { operation, table })
        throw error
      }
    }
  )
}
