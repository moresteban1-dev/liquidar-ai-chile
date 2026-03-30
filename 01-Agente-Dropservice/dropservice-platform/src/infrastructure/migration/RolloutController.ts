import { featureFlags } from '@/infrastructure/feature-flags/FeatureFlags'
import { migrationMonitor } from './MigrationMonitor'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

/**
 * RolloutController
 * 
 * Controla el rollout gradual de la migración v1 → v2
 * Puede ejecutarse manualmente o via cron job
 */

export interface RolloutStep {
  percentage: number
  minDurationMinutes: number
  requiredSuccessRate?: number // Marcar como opcional
  maxErrorRate?: number        // Marcar como opcional
}

export interface RolloutStatus {
  flagName: string
  currentPercentage: number
  currentStep: number
  totalSteps: number
  lastCheckAt?: Date
  recommendation: string
  canAdvance: boolean
  metrics?: {
    v1Requests: number
    v2Requests: number
    v2SuccessRate: number
    v2ErrorRate: number
    v2AvgLatency: number
  }
}

// Pasos predefinidos de rollout
const DEFAULT_ROLLOUT_STEPS: RolloutStep[] = [
  { percentage: 5,   minDurationMinutes: 30,  requiredSuccessRate: 99, maxErrorRate: 1 },
  { percentage: 10,  minDurationMinutes: 60,  requiredSuccessRate: 99, maxErrorRate: 1 },
  { percentage: 25,  minDurationMinutes: 120, requiredSuccessRate: 98, maxErrorRate: 2 },
  { percentage: 50,  minDurationMinutes: 240, requiredSuccessRate: 98, maxErrorRate: 2 },
  { percentage: 75,  minDurationMinutes: 360, requiredSuccessRate: 97, maxErrorRate: 3 },
  { percentage: 100, minDurationMinutes: 0,   requiredSuccessRate: 95, maxErrorRate: 5 }
]

export class RolloutController {
  private steps: RolloutStep[]
  // Eliminado: stepStartTimes que no se usaba

  constructor(steps?: RolloutStep[]) {
    this.steps = steps || DEFAULT_ROLLOUT_STEPS
  }

  /**
   * Obtiene el estado actual del rollout
   */
  public getStatus(flagName: string, endpoint: string): RolloutStatus {
    const flag = featureFlags.getFlag(flagName)
    const currentPercentage = flag?.percentage || 0

    const currentStep = this.steps.findIndex(s => s.percentage >= currentPercentage)
    const step = this.steps[currentStep] || this.steps[this.steps.length - 1]

    if (!step) {
      return {
        flagName,
        currentPercentage,
        currentStep: 0,
        totalSteps: this.steps.length,
        lastCheckAt: new Date(),
        recommendation: 'maintain',
        canAdvance: false
      }
    }

    // Generar reporte de métricas
    const reportResult = migrationMonitor.generateReport(endpoint, step.minDurationMinutes)

    let metrics
    let canAdvance = false
    let recommendation = 'maintain'

    if (reportResult.isSuccess()) {
      const report = reportResult.value

      metrics = {
        v1Requests: report.v1.totalRequests,
        v2Requests: report.v2.totalRequests,
        v2SuccessRate: report.v2.successRate,
        v2ErrorRate: report.v2.errorRate,
        v2AvgLatency: report.v2.avgDuration
      }

      recommendation = report.recommendation
      canAdvance = report.recommendation === 'increase'
    }

    return {
      flagName,
      currentPercentage,
      currentStep: currentStep >= 0 ? currentStep : 0,
      totalSteps: this.steps.length,
      lastCheckAt: new Date(),
      recommendation,
      canAdvance,
      metrics
    }
  }

  /**
   * Avanza al siguiente paso del rollout
   */
  public advance(flagName: string, endpoint: string): {
    success: boolean
    message: string
    newPercentage?: number
  } {
    const status = this.getStatus(flagName, endpoint)

    if (!status.canAdvance) {
      return {
        success: false,
        message: `Cannot advance: ${status.recommendation}. ` +
          `Current: ${status.currentPercentage}%`
      }
    }

    const nextStepIndex = status.currentStep + 1

    if (nextStepIndex >= this.steps.length) {
      return {
        success: false,
        message: 'Already at maximum rollout (100%)'
      }
    }

    const nextStep = this.steps[nextStepIndex]
    if (!nextStep) {
      return {
        success: false,
        message: 'Next rollout step not found'
      }
    }

    featureFlags.setPercentage(flagName, nextStep.percentage)

    // Eliminado: this.stepStartTimes.set(...)

    logger.info('Rollout advanced', {
      flagName,
      previousPercentage: status.currentPercentage,
      newPercentage: nextStep.percentage,
      step: nextStepIndex + 1,
      totalSteps: this.steps.length
    })

    return {
      success: true,
      message: `Advanced to ${nextStep.percentage}% (step ${nextStepIndex + 1}/${this.steps.length})`,
      newPercentage: nextStep.percentage
    }
  }

  /**
   * Retrocede al paso anterior
   */
  public rollback(flagName: string): {
    success: boolean
    message: string
    newPercentage: number
  } {
    const flag = featureFlags.getFlag(flagName)
    const currentPercentage = flag?.percentage || 0

    const currentStepIndex = this.steps.findIndex(s => s.percentage >= currentPercentage)

    if (currentStepIndex <= 0) {
      featureFlags.setPercentage(flagName, 0)

      logger.warn('Rollout rolled back to 0%', { flagName })

      return {
        success: true,
        message: 'Rolled back to 0% (v1 only)',
        newPercentage: 0
      }
    }

    const previousStep = this.steps[currentStepIndex - 1]
    if (!previousStep) {
      return {
        success: false,
        message: 'Previous rollout step not found',
        newPercentage: currentPercentage
      }
    }

    featureFlags.setPercentage(flagName, previousStep.percentage)

    logger.warn('Rollout rolled back', {
      flagName,
      from: currentPercentage,
      to: previousStep.percentage
    })

    return {
      success: true,
      message: `Rolled back from ${currentPercentage}% to ${previousStep.percentage}%`,
      newPercentage: previousStep.percentage
    }
  }

  /**
   * Emergency rollback a 0%
   */
  public emergencyRollback(flagName: string, reason: string): void {
    featureFlags.setPercentage(flagName, 0)

    logger.error('EMERGENCY ROLLBACK', new Error(reason), {
      flagName,
      reason
    })
  }

  /**
   * Obtiene plan de rollout completo
   */
  public getRolloutPlan(): RolloutStep[] {
    return [...this.steps]
  }
}

export const rolloutController = new RolloutController()
