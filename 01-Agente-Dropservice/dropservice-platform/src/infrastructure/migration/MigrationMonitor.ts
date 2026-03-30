import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'
import { Result, Success, Failure } from '@/core/shared/Result'

/**
 * MigrationMonitor
 * 
 * Tracks and compares v1 vs v2 endpoint performance
 * during gradual migration
 */

export interface MigrationMetric {
  endpoint: string
  version: 'v1' | 'v2'
  status: number
  duration: number
  timestamp: Date
  userId?: string | null
  error?: string
}

export interface MigrationReport {
  endpoint: string
  period: string
  v1: VersionMetrics
  v2: VersionMetrics
  comparison: ComparisonMetrics
  recommendation: 'increase' | 'maintain' | 'decrease' | 'rollback'
}

export interface VersionMetrics {
  totalRequests: number
  successRate: number
  errorRate: number
  avgDuration: number
  p50Duration: number
  p95Duration: number
  p99Duration: number
}

export interface ComparisonMetrics {
  latencyDifference: number     // positive = v2 slower
  errorRateDifference: number   // positive = v2 more errors
  isV2Better: boolean
  confidenceLevel: 'low' | 'medium' | 'high'
}

export class MigrationMonitor {
  private metrics: MigrationMetric[] = []
  private maxMetrics = 10000

  constructor(private readonly client?: SupabaseClient) {}

  /**
   * Registra una métrica de request
   */
  public record(metric: MigrationMetric): void {
    this.metrics.push(metric)

    // Limitar memoria
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Persistir async (no bloquea)
    if (this.client) {
      this.persistMetric(metric).catch(err =>
        logger.warn('Failed to persist migration metric', { error: err })
      )
    }
  }

  /**
   * Genera reporte de comparación v1 vs v2
   */
  public generateReport(
    endpoint: string,
    periodMinutes: number = 60
  ): Result<MigrationReport, string> {
    try {
      const cutoff = new Date(Date.now() - periodMinutes * 60 * 1000)

      const relevantMetrics = this.metrics.filter(
        m => m.endpoint === endpoint && m.timestamp >= cutoff
      )

      if (relevantMetrics.length < 10) {
        return new Failure(
          `Not enough data for report. Need at least 10 requests, have ${relevantMetrics.length}`
        )
      }

      const v1Metrics = relevantMetrics.filter(m => m.version === 'v1')
      const v2Metrics = relevantMetrics.filter(m => m.version === 'v2')

      if (v1Metrics.length === 0 && v2Metrics.length === 0) {
        return new Failure('No metrics found for this endpoint')
      }

      const v1Stats = this.calculateVersionMetrics(v1Metrics)
      const v2Stats = this.calculateVersionMetrics(v2Metrics)

      const comparison = this.compareVersions(v1Stats, v2Stats, v2Metrics.length)

      const recommendation = this.getRecommendation(comparison, v2Stats)

      const report: MigrationReport = {
        endpoint,
        period: `last ${periodMinutes} minutes`,
        v1: v1Stats,
        v2: v2Stats,
        comparison,
        recommendation
      }

      logger.info('Migration report generated', {
        endpoint,
        recommendation,
        v1Requests: v1Stats.totalRequests,
        v2Requests: v2Stats.totalRequests
      })

      return new Success(report)

    } catch (error) {
      return new Failure(`Error generating report: ${(error as Error).message}`)
    }
  }

  /**
   * Verifica si es seguro incrementar el rollout
   */
  public isSafeToIncrease(endpoint: string): boolean {
    const reportResult = this.generateReport(endpoint, 30) // últimos 30 min

    if (reportResult.isFailure()) {
      return false // No hay suficientes datos
    }

    const report = reportResult.value

    return (
      report.comparison.isV2Better &&
      report.v2.errorRate < 1 &&     // < 1% error rate
      report.v2.p95Duration < 1000   // < 1s P95
    )
  }

  private calculateVersionMetrics(metrics: MigrationMetric[]): VersionMetrics {
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        errorRate: 0,
        avgDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0
      }
    }

    const total = metrics.length
    const successful = metrics.filter(m => m.status >= 200 && m.status < 400)
    const errors = metrics.filter(m => m.status >= 400)
    const durations = metrics.map(m => m.duration).sort((a, b) => a - b)

    return {
      totalRequests: total,
      successRate: (successful.length / total) * 100,
      errorRate: (errors.length / total) * 100,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / total,
      p50Duration: this.percentile(durations, 50),
      p95Duration: this.percentile(durations, 95),
      p99Duration: this.percentile(durations, 99)
    }
  }

  private compareVersions(
    v1: VersionMetrics,
    v2: VersionMetrics,
    v2SampleSize: number
  ): ComparisonMetrics {
    const latencyDiff = v2.avgDuration - v1.avgDuration
    const errorRateDiff = v2.errorRate - v1.errorRate

    const isV2Better = latencyDiff <= 0 && errorRateDiff <= 0

    let confidence: 'low' | 'medium' | 'high'
    if (v2SampleSize < 50) {
      confidence = 'low'
    } else if (v2SampleSize < 200) {
      confidence = 'medium'
    } else {
      confidence = 'high'
    }

    return {
      latencyDifference: Math.round(latencyDiff),
      errorRateDifference: Math.round(errorRateDiff * 100) / 100,
      isV2Better,
      confidenceLevel: confidence
    }
  }

  private getRecommendation(
    comparison: ComparisonMetrics,
    v2Stats: VersionMetrics
  ): 'increase' | 'maintain' | 'decrease' | 'rollback' {
    // Rollback si v2 tiene > 5% error rate
    if (v2Stats.errorRate > 5) {
      return 'rollback'
    }

    // Decrease si v2 tiene > 2% error rate
    if (v2Stats.errorRate > 2) {
      return 'decrease'
    }

    // Maintain si no hay suficiente confianza
    if (comparison.confidenceLevel === 'low') {
      return 'maintain'
    }

    // Increase si v2 es mejor o igual
    if (comparison.isV2Better || comparison.errorRateDifference <= 0.5) {
      return 'increase'
    }

    return 'maintain'
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0

    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
  }

  private async persistMetric(metric: MigrationMetric): Promise<void> {
    if (!this.client) return

    await this.client.from('migration_metrics').insert({
      endpoint: metric.endpoint,
      version: metric.version,
      status: metric.status,
      duration: metric.duration,
      user_id: metric.userId,
      error_message: metric.error,
      created_at: metric.timestamp.toISOString()
    })
  }

  /**
   * Obtiene métricas brutas para debugging
   */
  public getRawMetrics(endpoint?: string): MigrationMetric[] {
    if (endpoint) {
      return this.metrics.filter(m => m.endpoint === endpoint)
    }
    return [...this.metrics]
  }

  /**
   * Limpia métricas en memoria
   */
  public clear(): void {
    this.metrics = []
  }
}

// Singleton
export const migrationMonitor = new MigrationMonitor()
