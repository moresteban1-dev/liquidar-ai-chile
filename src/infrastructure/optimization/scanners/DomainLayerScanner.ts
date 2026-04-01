import {
  ILayerScanner,
  OptimizationLayer,
  OptimizationFinding,
  OptimizationCategory,
  SeverityLevel,
} from '../DeepOptimizationEngine'

export class DomainLayerScanner implements ILayerScanner {
  readonly layer = OptimizationLayer.DOMAIN

  async scan(): Promise<OptimizationFinding[]> {
    const findings: OptimizationFinding[] = []

    findings.push({
      id: 'DOM-001',
      layer: OptimizationLayer.DOMAIN,
      category: OptimizationCategory.RELIABILITY,
      severity: SeverityLevel.HIGH,
      title: 'Order aggregate missing negative amount guard',
      description: 'The Order aggregate should validate that amounts are non-negative.',
      location: 'src/core/domain/aggregates/order/Order.ts',
      estimatedImpact: { reliability: 'Prevents corrupt financial data' },
      autoFixable: false,
      dependencies: []
    })

    findings.push({
      id: 'DOM-002',
      layer: OptimizationLayer.DOMAIN,
      category: OptimizationCategory.MAINTAINABILITY,
      severity: SeverityLevel.MEDIUM,
      title: 'Pricing logic leaking to handlers',
      description: 'Pricing margin calculation should be fully encapsulated in the domain.',
      location: 'src/core/application/handlers/CreateQuotationHandler.ts',
      estimatedImpact: { maintainability: 'Single source of truth for pricing' },
      autoFixable: false,
      dependencies: []
    })

    return findings
  }
}
