import { StructuredLogger } from './StructuredLogger'

export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertStatus = 'firing' | 'resolved'

export interface AlertRule {
  id: string
  name: string
  description: string
  severity: AlertSeverity
  condition: (metrics: Record<string, number>) => boolean
  cooldownMinutes: number
  channels: AlertChannel[]
}

export interface AlertChannel {
  type: 'slack' | 'email' | 'webhook' | 'console'
  config: Record<string, string>
}

export interface AlertEvent {
  ruleId: string
  ruleName: string
  severity: AlertSeverity
  status: AlertStatus
  message: string
  metrics: Record<string, number>
  triggeredAt: Date
}

const alertLogger = StructuredLogger.create({ component: 'alert-engine' })

export class AlertEngine {
  private rules: AlertRule[] = []
  private lastFired = new Map<string, Date>()
  private activeAlerts = new Map<string, AlertEvent>()

  public addRule(rule: AlertRule): void {
    this.rules.push(rule)
    alertLogger.info('Alert rule registered', { ruleId: rule.id, name: rule.name, severity: rule.severity })
  }

  public async evaluate(metrics: Record<string, number>): Promise<AlertEvent[]> {
    const events: AlertEvent[] = []

    for (const rule of this.rules) {
      try {
        const shouldFire = rule.condition(metrics)
        const isCurrentlyFiring = this.activeAlerts.has(rule.id)

        if (shouldFire && !isCurrentlyFiring) {
          const lastFiredAt = this.lastFired.get(rule.id)
          if (lastFiredAt) {
            const cooldownMs = rule.cooldownMinutes * 60 * 1000
            if (Date.now() - lastFiredAt.getTime() < cooldownMs) continue
          }

          const event: AlertEvent = {
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'firing',
            message: `Alert: ${rule.name} - ${rule.description}`,
            metrics,
            triggeredAt: new Date()
          }

          this.activeAlerts.set(rule.id, event)
          this.lastFired.set(rule.id, new Date())
          events.push(event)
          await this.sendAlert(event, rule.channels)
          alertLogger.warn('Alert fired', { ruleId: rule.id, name: rule.name, severity: rule.severity, metrics })

        } else if (!shouldFire && isCurrentlyFiring) {
          const event: AlertEvent = {
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            status: 'resolved',
            message: `Resolved: ${rule.name}`,
            metrics,
            triggeredAt: new Date()
          }
          this.activeAlerts.delete(rule.id)
          events.push(event)
          await this.sendAlert(event, rule.channels)
          alertLogger.info('Alert resolved', { ruleId: rule.id, name: rule.name })
        }
      } catch (error) {
        alertLogger.error('Error evaluating alert rule', error as Error, { ruleId: rule.id })
      }
    }
    return events
  }

  public getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values())
  }

  private async sendAlert(event: AlertEvent, channels: AlertChannel[]): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel.type) {
          case 'console': this.sendConsoleAlert(event); break
          case 'slack': await this.sendSlackAlert(event, channel.config); break
          case 'webhook': await this.sendWebhookAlert(event, channel.config); break
        }
      } catch (error) {
        alertLogger.error('Failed to send alert to channel', error as Error, { channel: channel.type, ruleId: event.ruleId })
      }
    }
  }

  private sendConsoleAlert(event: AlertEvent): void {
    const icon = event.severity === 'critical' ? '🚨' : event.severity === 'warning' ? '⚠️' : 'ℹ️'
    const status = event.status === 'firing' ? '🔴 FIRING' : '🟢 RESOLVED'
    alertLogger.info(`${icon} [ALERT] ${status} ${event.ruleName}: ${event.message}`, { 
      severity: event.severity, 
      status: event.status 
    })
  }

  private async sendSlackAlert(event: AlertEvent, config: Record<string, string>): Promise<void> {
    const webhookUrl = config.webhookUrl; if (!webhookUrl) return
    const color = event.severity === 'critical' ? '#FF0000' : event.severity === 'warning' ? '#FFA500' : '#0000FF'
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: `${event.status === 'firing' ? '🔴' : '🟢'} ${event.ruleName}`,
          text: event.message,
          fields: Object.entries(event.metrics).map(([key, value]) => ({ title: key, value: String(value), short: true })),
          ts: Math.floor(event.triggeredAt.getTime() / 1000)
        }]
      })
    })
  }

  private async sendWebhookAlert(event: AlertEvent, config: Record<string, string>): Promise<void> {
    const url = config.url; if (!url) return
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(config.authHeader ? { 'Authorization': config.authHeader } : {}) },
      body: JSON.stringify(event)
    })
  }
}

export function createDefaultAlertRules(): AlertRule[] {
  const consoleChannel: AlertChannel = { type: 'console', config: {} }
  const slackChannel: AlertChannel = { type: 'slack', config: { webhookUrl: process.env.SLACK_WEBHOOK_URL || '' } }
  const channels = process.env.SLACK_WEBHOOK_URL ? [consoleChannel, slackChannel] : [consoleChannel]

  return [
    { id: 'high-error-rate', name: 'High Error Rate', description: 'API error rate exceeds 5%', severity: 'critical', condition: (m) => (m.errorRate || 0) > 5, cooldownMinutes: 15, channels },
    { id: 'elevated-error-rate', name: 'Elevated Error Rate', description: 'API error rate exceeds 2%', severity: 'warning', condition: (m) => (m.errorRate || 0) > 2 && (m.errorRate || 0) <= 5, cooldownMinutes: 30, channels },
    { id: 'high-latency', name: 'High API Latency', description: 'P95 latency exceeds 2000ms', severity: 'critical', condition: (m) => (m.p95Latency || 0) > 2000, cooldownMinutes: 15, channels },
    { id: 'elevated-latency', name: 'Elevated API Latency', description: 'P95 latency exceeds 1000ms', severity: 'warning', condition: (m) => (m.p95Latency || 0) > 1000 && (m.p95Latency || 0) <= 2000, cooldownMinutes: 30, channels },
    { id: 'event-queue-backlog', name: 'Event Queue Backlog', description: 'More than 100 unprocessed events', severity: 'warning', condition: (m) => (m.pendingEvents || 0) > 100, cooldownMinutes: 30, channels },
    { id: 'high-memory', name: 'High Memory Usage', description: 'Memory usage exceeds 85%', severity: 'warning', condition: (m) => (m.memoryUsage || 0) > 85, cooldownMinutes: 15, channels },
    { id: 'critical-memory', name: 'Critical Memory Usage', description: 'Memory usage exceeds 95%', severity: 'critical', condition: (m) => (m.memoryUsage || 0) > 95, cooldownMinutes: 5, channels }
  ]
}

export const alertEngine = new AlertEngine()
createDefaultAlertRules().forEach(rule => alertEngine.addRule(rule))
