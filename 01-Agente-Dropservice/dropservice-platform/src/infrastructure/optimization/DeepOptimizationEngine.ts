import { StructuredLogger } from '../telemetry/StructuredLogger'
import { MetricsCollector } from '../telemetry/MetricsCollector'

export enum OptimizationLayer {
  DOMAIN = 'domain',
  APPLICATION = 'application',
  PERSISTENCE = 'persistence',
  HTTP = 'http',
  TELEMETRY = 'telemetry',
  EVENTS = 'events',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
}

export enum SeverityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export enum OptimizationCategory {
  CODE_SMELL = 'code_smell',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  RELIABILITY = 'reliability',
  MAINTAINABILITY = 'maintainability',
  OBSERVABILITY = 'observability',
  DEAD_CODE = 'dead_code',
  TYPE_SAFETY = 'type_safety',
  MEMORY = 'memory',
  CONCURRENCY = 'concurrency',
}

export interface OptimizationFinding {
  id: string
  layer: OptimizationLayer
  category: OptimizationCategory
  severity: SeverityLevel
  title: string
  description: string
  location: string
  currentCode?: string
  suggestedFix?: string
  estimatedImpact: {
    performance?: string
    reliability?: string
    maintainability?: string
  }
  autoFixable: boolean
  dependencies: string[]
}

export interface OptimizationReport {
  timestamp: string
  duration_ms: number
  totalFindings: number
  bySeverity: Record<SeverityLevel, number>
  byLayer: Record<OptimizationLayer, number>
  byCategory: Record<OptimizationCategory, number>
  findings: OptimizationFinding[]
  score: number
  recommendations: string[]
  autoFixesApplied: number
  autoFixesAvailable: number
}

export interface ScanOptions {
  layers?: OptimizationLayer[]
  categories?: OptimizationCategory[]
  minSeverity?: SeverityLevel
  autoFix?: boolean
  dryRun?: boolean
  maxFindings?: number
}

export interface ILayerScanner {
  readonly layer: OptimizationLayer
  scan(): Promise<OptimizationFinding[]>
  autoFix?(finding: OptimizationFinding): Promise<boolean>
}

export class DeepOptimizationEngine {
  private scanners: Map<OptimizationLayer, ILayerScanner> = new Map()

  constructor(
    private readonly logger: StructuredLogger,
    private readonly metrics: MetricsCollector,
  ) {
    this.logger = logger.child({ component: 'DeepOptimizationEngine' })
  }

  registerScanner(scanner: ILayerScanner): void {
    this.scanners.set(scanner.layer, scanner)
    this.logger.info(`Scanner registered for layer: ${scanner.layer}`)
  }

  async runFullScan(options: ScanOptions = {}): Promise<OptimizationReport> {
    const startTime = Date.now()
    const {
      layers = Object.values(OptimizationLayer),
      categories,
      minSeverity = SeverityLevel.INFO,
      autoFix = false,
      dryRun = true,
      maxFindings = 500,
    } = options

    const allFindings: OptimizationFinding[] = []
    let autoFixesApplied = 0
    let autoFixesAvailable = 0

    for (const layer of layers) {
      const scanner = this.scanners.get(layer)
      if (!scanner) continue

      try {
        const findings = await scanner.scan()
        const filtered = this.filterFindings(findings, { categories, minSeverity })

        for (const finding of filtered) {
          if (finding.autoFixable) {
            autoFixesAvailable++
            if (autoFix && !dryRun && scanner.autoFix) {
              const fixed = await scanner.autoFix(finding)
              if (fixed) autoFixesApplied++
            }
          }
        }
        allFindings.push(...filtered)
      } catch (error) {
        this.logger.error(`Scanner failed for layer: ${layer}`, { error })
      }
    }

    const severityOrder: Record<SeverityLevel, number> = {
      [SeverityLevel.CRITICAL]: 0,
      [SeverityLevel.HIGH]: 1,
      [SeverityLevel.MEDIUM]: 2,
      [SeverityLevel.LOW]: 3,
      [SeverityLevel.INFO]: 4,
    }

    allFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    const truncatedFindings = allFindings.slice(0, maxFindings)
    const duration = Date.now() - startTime

    const report = this.buildReport(truncatedFindings, duration, autoFixesApplied, autoFixesAvailable)
    this.metrics.recordGauge('optimization.score', report.score)
    return report
  }

  private filterFindings(findings: OptimizationFinding[], filters: { categories?: OptimizationCategory[], minSeverity?: SeverityLevel }): OptimizationFinding[] {
    const severityValue: Record<SeverityLevel, number> = {
      [SeverityLevel.CRITICAL]: 4, [SeverityLevel.HIGH]: 3, [SeverityLevel.MEDIUM]: 2, [SeverityLevel.LOW]: 1, [SeverityLevel.INFO]: 0
    }
    return findings.filter(f => {
      if (filters.categories && !filters.categories.includes(f.category)) return false
      if (filters.minSeverity && severityValue[f.severity] < severityValue[filters.minSeverity]) return false
      return true
    })
  }

  private buildReport(findings: OptimizationFinding[], duration: number, autoFixesApplied: number, autoFixesAvailable: number): OptimizationReport {
    const bySeverity = this.countBy(findings, 'severity') as Record<SeverityLevel, number>
    const byLayer = this.countBy(findings, 'layer') as Record<OptimizationLayer, number>
    const byCategory = this.countBy(findings, 'category') as Record<OptimizationCategory, number>

    const severityWeights: Record<SeverityLevel, number> = {
      [SeverityLevel.CRITICAL]: 10, [SeverityLevel.HIGH]: 5, [SeverityLevel.MEDIUM]: 2, [SeverityLevel.LOW]: 1, [SeverityLevel.INFO]: 0
    }

    const totalPenalty = findings.reduce((sum, f) => sum + severityWeights[f.severity], 0)
    const score = Math.max(0, Math.round(100 - (totalPenalty / 10)))
    const recommendations = this.generateRecommendations(findings, score)

    return {
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      totalFindings: findings.length,
      bySeverity, byLayer, byCategory,
      findings, score, recommendations,
      autoFixesApplied, autoFixesAvailable
    }
  }

  private countBy<T extends Record<string, any>>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce((acc, item) => {
      const val = String(item[key])
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private generateRecommendations(findings: OptimizationFinding[], score: number): string[] {
    const recs: string[] = []
    const criticals = findings.filter(f => f.severity === SeverityLevel.CRITICAL)
    if (criticals.length > 0) recs.push(`🚨 CRITICAL: ${criticals.length} findings must be resolved.`)
    if (score < 70) recs.push('⚠️ Overall system health below 70%. Stop features, start optimization.')
    else if (score >= 95) recs.push('✅ System health excellent.')
    return recs
  }
}
