import { SupabaseClient } from '@supabase/supabase-js'
import {
  ILayerScanner,
  OptimizationLayer,
  OptimizationFinding,
  OptimizationCategory,
  SeverityLevel,
} from '../DeepOptimizationEngine'

export class PersistenceLayerScanner implements ILayerScanner {
  readonly layer = OptimizationLayer.PERSISTENCE

  constructor(private readonly supabase: SupabaseClient) {}

  async scan(): Promise<OptimizationFinding[]> {
    const findings: OptimizationFinding[] = []

    try {
      const { data, error } = await this.supabase.rpc('get_db_performance_summary')
      if (!error && data) {
        for (const metric of data) {
          if (metric.status === 'warning' || metric.status === 'critical') {
            findings.push({
              id: `PERS-DB-${metric.metric_name}`,
              layer: OptimizationLayer.PERSISTENCE,
              category: OptimizationCategory.PERFORMANCE,
              severity: metric.status === 'critical' ? SeverityLevel.CRITICAL : SeverityLevel.HIGH,
              title: `DB Performance Issue: ${metric.metric_name}`,
              description: `Metric ${metric.metric_name} is ${metric.metric_value} (Status: ${metric.status})`,
              location: 'PostgreSQL Stats',
              estimatedImpact: { performance: 'Improving DB response times' },
              autoFixable: false,
              dependencies: []
            })
          }
        }
      }
    } catch (e) {
      // RPC might not exist yet
    }

    findings.push({
      id: 'PERS-N1-001',
      layer: OptimizationLayer.PERSISTENCE,
      category: OptimizationCategory.PERFORMANCE,
      severity: SeverityLevel.CRITICAL,
      title: 'Potential N+1 query in Order Lists',
      description: 'Verify if loading relations creates multiple queries.',
      location: 'src/infrastructure/persistence/supabase/repositories/SupabaseOrderRepository.ts',
      estimatedImpact: { performance: 'Significant latency reduction' },
      autoFixable: false,
      dependencies: []
    })

    return findings
  }
}
