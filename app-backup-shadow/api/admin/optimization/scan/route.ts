import { NextRequest, NextResponse } from 'next/server'
import { DeepOptimizationEngine, ScanOptions, OptimizationLayer } from '@/infrastructure/optimization/DeepOptimizationEngine'
import { DomainLayerScanner } from '@/infrastructure/optimization/scanners/DomainLayerScanner'
import { PersistenceLayerScanner } from '@/infrastructure/optimization/scanners/PersistenceLayerScanner'
import { SecurityLayerScanner } from '@/infrastructure/optimization/scanners/SecurityLayerScanner'
import { getContainer } from '@/infrastructure/di/Container'
import { ok, internalError } from '@/infrastructure/http/helpers/responses'

export async function POST(req: NextRequest) {
  const container = getContainer()
  const logger = container.resolve('logger')
  const metrics = container.resolve('metrics')
  const supabase = container.resolve('supabase')

  try {
    const body = await req.json().catch(() => ({}))
    const options: ScanOptions = {
      layers: body.layers ?? [OptimizationLayer.DOMAIN, OptimizationLayer.PERSISTENCE, OptimizationLayer.SECURITY],
      autoFix: body.autoFix ?? false,
      dryRun: body.dryRun ?? true,
      minSeverity: body.minSeverity ?? 'info',
    }

    const engine = new DeepOptimizationEngine(logger, metrics)
    engine.registerScanner(new DomainLayerScanner())
    engine.registerScanner(new PersistenceLayerScanner(supabase))
    engine.registerScanner(new SecurityLayerScanner())

    const report = await engine.runFullScan(options)

    // Save scan to DB
    await supabase.from('optimization_scans').insert({
      score: report.score,
      total_findings: report.totalFindings,
      report,
      duration_ms: report.duration_ms
    })

    return ok(report)
  } catch (error) {
    logger.error('Optimization scan API failed', { error })
    return internalError('Failed to execute optimization scan')
  }
}
