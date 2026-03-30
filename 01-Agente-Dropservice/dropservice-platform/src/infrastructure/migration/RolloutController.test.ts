import { describe, it, expect, beforeEach } from 'vitest'
import { RolloutController } from './RolloutController'
import { MigrationMonitor } from './MigrationMonitor'
import { featureFlags } from '@/infrastructure/feature-flags/FeatureFlags'

describe('RolloutController', () => {
  let controller: RolloutController

  beforeEach(() => {
    controller = new RolloutController([
      { percentage: 10, minDurationMinutes: 5, requiredSuccessRate: 99, maxErrorRate: 1 },
      { percentage: 50, minDurationMinutes: 10, requiredSuccessRate: 98, maxErrorRate: 2 },
      { percentage: 100, minDurationMinutes: 0, requiredSuccessRate: 95, maxErrorRate: 5 }
    ])
  })

  describe('getStatus', () => {
    it('should return current rollout status', () => {
      const status = controller.getStatus('v2-orders-create', '/api/orders')

      expect(status.flagName).toBe('v2-orders-create')
      expect(status.currentPercentage).toBeDefined()
      expect(status.totalSteps).toBe(3)
      expect(status.lastCheckAt).toBeInstanceOf(Date)
    })
  })

  describe('getRolloutPlan', () => {
    it('should return all rollout steps', () => {
      const plan = controller.getRolloutPlan()

      expect(plan).toHaveLength(3)
      expect(plan[0].percentage).toBe(10)
      expect(plan[1].percentage).toBe(50)
      expect(plan[2].percentage).toBe(100)
    })
  })

  describe('rollback', () => {
    it('should rollback to 0% from first step', () => {
      const result = controller.rollback('v2-orders-create')

      expect(result.success).toBe(true)
      expect(result.newPercentage).toBe(0)
    })
  })

  describe('emergencyRollback', () => {
    it('should immediately set to 0%', () => {
      controller.emergencyRollback('v2-orders-create', 'Critical error detected')
      
      const flag = featureFlags.getFlag('v2-orders-create')
      expect(flag?.percentage).toBe(0)
    })
  })
})
