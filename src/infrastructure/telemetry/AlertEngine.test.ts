import { describe, it, expect, beforeEach } from 'vitest'
import { AlertEngine, AlertChannel } from './AlertEngine'

describe('AlertEngine', () => {
  let engine: AlertEngine
  const consoleChannel: AlertChannel = { type: 'console', config: {} }

  beforeEach(() => { engine = new AlertEngine() })

  it('should register alert rule', () => {
    engine.addRule({ id: 'test', name: 'Alerta', description: 'Desc', severity: 'warning', condition: (m) => m.val > 5, cooldownMinutes: 15, channels: [consoleChannel] })
  })

  it('should fire alert when condition met', async () => {
    engine.addRule({ id: 'err', name: 'Error', description: 'Desc', severity: 'critical', condition: (m) => m.rate > 5, cooldownMinutes: 0, channels: [consoleChannel] })
    const events = await engine.evaluate({ rate: 10 })
    expect(events).toHaveLength(1)
    expect(events[0].status).toBe('firing')
  })

  it('should resolve alert when condition clears', async () => {
    engine.addRule({ id: 'err', name: 'Error', description: 'Desc', severity: 'critical', condition: (m) => m.rate > 5, cooldownMinutes: 0, channels: [consoleChannel] })
    await engine.evaluate({ rate: 10 })
    expect(engine.getActiveAlerts()).toHaveLength(1)
    const events = await engine.evaluate({ rate: 1 })
    expect(events).toHaveLength(1)
    expect(events[0].status).toBe('resolved')
    expect(engine.getActiveAlerts()).toHaveLength(0)
  })

  it('should respect cooldown', async () => {
    engine.addRule({ id: 'err', name: 'Error', description: 'Desc', severity: 'critical', condition: (m) => m.rate > 5, cooldownMinutes: 15, channels: [consoleChannel] })
    await engine.evaluate({ rate: 10 }) // Fire
    await engine.evaluate({ rate: 1 })  // Resolve
    const events = await engine.evaluate({ rate: 10 }) // Should NOT fire again due to cooldown
    expect(events).toHaveLength(0)
  })
})
