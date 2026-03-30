import { describe, it, expect } from 'vitest'
import { FeatureFlags } from './FeatureFlags'

describe('FeatureFlags', () => {
  describe('Percentage Strategy', () => {
    it('should enable flag at 100%', () => {
      const flags = new FeatureFlags({
        'v2-orders-create': { percentage: 100 }
      })

      // Should always be true at 100%
      for (let i = 0; i < 100; i++) {
        expect(flags.isEnabled('v2-orders-create', {
          userId: `user-${i}`
        })).toBe(true)
      }
    })

    it('should disable flag at 0%', () => {
      const flags = new FeatureFlags({
        'v2-orders-create': { percentage: 0 }
      })

      for (let i = 0; i < 100; i++) {
        expect(flags.isEnabled('v2-orders-create', {
          userId: `user-${i}`
        })).toBe(false)
      }
    })

    it('should be deterministic for same userId', () => {
      const flags = new FeatureFlags({
        'v2-orders-create': { percentage: 50 }
      })

      const result1 = flags.isEnabled('v2-orders-create', { userId: 'user-abc' })
      const result2 = flags.isEnabled('v2-orders-create', { userId: 'user-abc' })

      expect(result1).toBe(result2) // Same user = same result
    })

    it('should distribute roughly according to percentage', () => {
      const flags = new FeatureFlags({
        'v2-orders-create': { percentage: 50 }
      })

      let enabledCount = 0
      const total = 1000

      for (let i = 0; i < total; i++) {
        if (flags.isEnabled('v2-orders-create', { userId: `user-${i}` })) {
          enabledCount++
        }
      }

      // Should be roughly 50% (with 15% margin for small sample/deterministic hash spread)
      const ratio = enabledCount / total
      expect(ratio).toBeGreaterThan(0.35)
      expect(ratio).toBeLessThan(0.65)
    })

    it('should handle 10% rollout', () => {
      const flags = new FeatureFlags({
        'v2-orders-create': { percentage: 10 }
      })

      let enabledCount = 0
      const total = 1000

      for (let i = 0; i < total; i++) {
        if (flags.isEnabled('v2-orders-create', { userId: `user-${i}` })) {
          enabledCount++
        }
      }

      const ratio = enabledCount / total
      expect(ratio).toBeGreaterThan(0.03)
      expect(ratio).toBeLessThan(0.20)
    })
  })

  describe('User Strategy', () => {
    it('should enable for whitelisted users', () => {
      const flags = new FeatureFlags({
        'v2-full': {
          enabled: true,
          strategy: 'user',
          allowedUsers: ['admin-001', 'tester-001']
        }
      })

      expect(flags.isEnabled('v2-full', { userId: 'admin-001' })).toBe(true)
      expect(flags.isEnabled('v2-full', { userId: 'tester-001' })).toBe(true)
      expect(flags.isEnabled('v2-full', { userId: 'random-user' })).toBe(false)
    })
  })

  describe('Header Strategy', () => {
    it('should enable based on header', () => {
      const flags = new FeatureFlags({
        'v2-full': {
          enabled: true,
          strategy: 'header',
          headerName: 'x-use-v2',
          headerValue: 'true'
        }
      })

      const headersV2 = new Headers()
      headersV2.set('x-use-v2', 'true')

      const headersV1 = new Headers()

      expect(flags.isEnabled('v2-full', { headers: headersV2 })).toBe(true)
      expect(flags.isEnabled('v2-full', { headers: headersV1 })).toBe(false)
    })
  })

  describe('Disabled Flags', () => {
    it('should return false for disabled flag', () => {
      const flags = new FeatureFlags({
        'v2-full': { enabled: false }
      })

      expect(flags.isEnabled('v2-full', { userId: 'anyone' })).toBe(false)
    })

    it('should return false for unknown flag', () => {
      const flags = new FeatureFlags()

      expect(flags.isEnabled('unknown-flag')).toBe(false)
    })
  })

  describe('Flag Management', () => {
    it('should list all flags', () => {
      const flags = new FeatureFlags()
      const allFlags = flags.getAllFlags()

      expect(allFlags.length).toBeGreaterThan(0)
    })

    it('should update percentage', () => {
      const flags = new FeatureFlags({
        'v2-orders-create': { percentage: 10 }
      })

      flags.setPercentage('v2-orders-create', 50)

      const flag = flags.getFlag('v2-orders-create')
      expect(flag?.percentage).toBe(50)
    })

    it('should clamp percentage between 0 and 100', () => {
      const flags = new FeatureFlags()

      flags.setPercentage('v2-orders-create', 150)
      expect(flags.getFlag('v2-orders-create')?.percentage).toBe(100)

      flags.setPercentage('v2-orders-create', -10)
      expect(flags.getFlag('v2-orders-create')?.percentage).toBe(0)
    })
  })
})
