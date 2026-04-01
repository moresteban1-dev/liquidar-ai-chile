import { describe, it, expect, beforeEach } from 'vitest'
import { MigrationMonitor } from './MigrationMonitor'

describe('MigrationMonitor', () => {
  let monitor: MigrationMonitor

  beforeEach(() => {
    monitor = new MigrationMonitor()
  })

  const recordMetrics = (
    endpoint: string,
    version: 'v1' | 'v2',
    count: number,
    avgDuration: number = 200,
    errorRate: number = 0
  ) => {
    for (let i = 0; i < count; i++) {
      const isError = Math.random() < errorRate
      monitor.record({
        endpoint,
        version,
        status: isError ? 500 : 200,
        duration: avgDuration + (Math.random() * 100 - 50),
        timestamp: new Date(),
        userId: `user-${i}`
      })
    }
  }

  describe('Record & Report', () => {
    it('should record metrics', () => {
      monitor.record({
        endpoint: '/api/orders',
        version: 'v2',
        status: 200,
        duration: 150,
        timestamp: new Date()
      })

      const metrics = monitor.getRawMetrics('/api/orders')
      expect(metrics).toHaveLength(1)
    })

    it('should generate report with sufficient data', () => {
      recordMetrics('/api/orders', 'v1', 50, 200)
      recordMetrics('/api/orders', 'v2', 50, 150)

      const result = monitor.generateReport('/api/orders')

      expect(result.isSuccess()).toBe(true)

      const report = result.value

      expect(report.v1.totalRequests).toBe(50)
      expect(report.v2.totalRequests).toBe(50)
      expect(report.v1.successRate).toBe(100)
      expect(report.v2.successRate).toBe(100)
    })

    it('should fail with insufficient data', () => {
      recordMetrics('/api/orders', 'v1', 3)

      const result = monitor.generateReport('/api/orders')

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('Not enough data')
    })

    it('should detect v2 is better when faster', () => {
      recordMetrics('/api/orders', 'v1', 100, 300) // v1: ~300ms
      recordMetrics('/api/orders', 'v2', 100, 150) // v2: ~150ms

      const report = monitor.generateReport('/api/orders').value as any

      expect(report.comparison.isV2Better).toBe(true)
      expect(report.comparison.latencyDifference).toBeLessThan(0)
    })

    it('should detect v2 is worse when slower', () => {
      recordMetrics('/api/orders', 'v1', 100, 150) // v1: ~150ms
      recordMetrics('/api/orders', 'v2', 100, 400) // v2: ~400ms

      const report = monitor.generateReport('/api/orders').value as any

      expect(report.comparison.latencyDifference).toBeGreaterThan(0)
    })
  })

  describe('Recommendations', () => {
    it('should recommend increase when v2 is better', () => {
      recordMetrics('/api/orders', 'v1', 200, 300, 0.01)
      recordMetrics('/api/orders', 'v2', 200, 150, 0)

      const report = monitor.generateReport('/api/orders').value as any

      expect(report.recommendation).toBe('increase')
    })

    it('should recommend rollback when v2 has high errors', () => {
      recordMetrics('/api/orders', 'v1', 200, 200, 0.01)
      recordMetrics('/api/orders', 'v2', 200, 150, 0.10) // 10% error rate

      const report = monitor.generateReport('/api/orders').value as any

      expect(report.recommendation).toBe('rollback')
    })

    it('should recommend decrease when v2 has moderate errors', () => {
      recordMetrics('/api/orders', 'v1', 200, 200, 0.01)
      recordMetrics('/api/orders', 'v2', 200, 150, 0.03) // 3% error rate

      const report = monitor.generateReport('/api/orders').value as any

      expect(report.recommendation).toBe('decrease')
    })

    it('should recommend maintain when low confidence', () => {
      recordMetrics('/api/orders', 'v1', 30, 200)
      recordMetrics('/api/orders', 'v2', 20, 150) // < 50 requests

      const report = monitor.generateReport('/api/orders').value as any

      expect(report.comparison.confidenceLevel).toBe('low')
      expect(report.recommendation).toBe('maintain')
    })
  })

  describe('Safety Check', () => {
    it('should confirm safe to increase when v2 is healthy', () => {
      recordMetrics('/api/orders', 'v1', 200, 300)
      recordMetrics('/api/orders', 'v2', 200, 150) // Faster, no errors

      expect(monitor.isSafeToIncrease('/api/orders')).toBe(true)
    })

    it('should reject increase when insufficient data', () => {
      recordMetrics('/api/orders', 'v2', 5, 150)

      expect(monitor.isSafeToIncrease('/api/orders')).toBe(false)
    })

    it('should reject increase when high error rate', () => {
      recordMetrics('/api/orders', 'v1', 200, 200)
      recordMetrics('/api/orders', 'v2', 200, 150, 0.05) // 5% errors

      expect(monitor.isSafeToIncrease('/api/orders')).toBe(false)
    })
  })

  describe('Memory Management', () => {
    it('should limit stored metrics', () => {
      for (let i = 0; i < 15000; i++) {
        monitor.record({
          endpoint: '/api/orders',
          version: 'v2',
          status: 200,
          duration: 100,
          timestamp: new Date()
        })
      }

      const metrics = monitor.getRawMetrics()
      expect(metrics.length).toBeLessThanOrEqual(10000)
    })

    it('should clear metrics', () => {
      recordMetrics('/api/orders', 'v2', 100)

      monitor.clear()

      expect(monitor.getRawMetrics()).toHaveLength(0)
    })
  })
})
