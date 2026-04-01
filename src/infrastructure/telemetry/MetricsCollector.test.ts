import { describe, it, expect } from 'vitest'
import { metricsCollector } from './MetricsCollector'

describe('MetricsCollector', () => {
  it('should record metrics without throwing', () => {
    expect(() => {
      metricsCollector.recordOrderCreated({ clientId: '1', eventType: 'test' })
      metricsCollector.recordHandlerDuration('test', 100, true)
      metricsCollector.recordDbQuery('SELECT', 'table', 10, true)
    }).not.toThrow()
  })
})
