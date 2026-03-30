import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from './StructuredLogger'
import { withSpan } from './Tracer'
import { Result, Success, Failure } from '@/core/shared/Result'

// Raw Database Row Interfaces
interface MetricRow {
  endpoint: string
  status: number
  duration: number
}

interface OrderRow {
  id: string
  state: string
  client_id: string
  created_at: string
  completed_at: string | null
}

interface PricingRow {
  order_id: string
  final_price: number
  admin_commission: number
  platform_fee: number
  currency: string
}

interface QuotationRow {
  id: string
  status: string
  created_at: string
}

export interface ServiceHealthData {
  timestamp: string
  api: {
    totalRequests: number
    errorRate: number
    avgLatency: number
    p95Latency: number
    p99Latency: number
    requestsByStatus: Record<string, number>
    requestsByEndpoint: Array<{
      endpoint: string
      count: number
      avgLatency: number
      errorRate: number
    }>
  }
  database: {
    avgQueryTime: number
    slowQueries: number
    connectionPoolUsage: number
    totalQueries: number
  }
  events: {
    pending: number
    processed: number
    failed: number
    avgProcessingTime: number
  }
  system: {
    uptime: number
    memoryUsage: number
    cpuUsage: number
  }
}

export interface BusinessKPIData {
  timestamp: string
  period: string
  orders: {
    total: number
    active: number
    completed: number
    cancelled: number
    conversionRate: number
    avgCompletionDays: number
    byState: Record<string, number>
    trend: Array<{ date: string; count: number }>
  }
  quotations: {
    total: number
    approved: number
    rejected: number
    approvalRate: number
    avgResponseTime: number
    avgValue: number
  }
  revenue: {
    total: number
    profit: number
    profitMargin: number
    currency: string
    trend: Array<{ date: string; amount: number }>
    byProvider: Array<{
      providerId: string
      providerName: string
      revenue: number
      profit: number
      orderCount: number
    }>
  }
  clients: {
    total: number
    active: number
    newThisPeriod: number
    topClients: Array<{
      clientId: string
      orderCount: number
      totalSpent: number
    }>
  }
}

export class DashboardCollector {
  constructor(private readonly client: SupabaseClient) {}

  async collectServiceHealth(): Promise<Result<ServiceHealthData, string>> {
    return withSpan('DashboardCollector.serviceHealth', {}, async () => {
      try {
        const { data: apiMetrics } = await this.client
          .from('migration_metrics')
          .select('endpoint, status, duration')
          .gte('created_at', new Date(Date.now() - 3600000).toISOString())

        const metrics = (apiMetrics as MetricRow[]) || []
        const totalRequests = metrics.length
        const errors = metrics.filter(m => m.status >= 400)
        const durations = metrics.map(m => m.duration).sort((a, b) => a - b)

        const endpointMap = new Map<string, { count: number; durations: number[]; errors: number }>()
        for (const m of metrics) {
          const existing = endpointMap.get(m.endpoint) || { count: 0, durations: [], errors: 0 }
          existing.count++
          existing.durations.push(m.duration)
          if (m.status >= 400) existing.errors++
          endpointMap.set(m.endpoint, existing)
        }

        const requestsByEndpoint = Array.from(endpointMap.entries()).map(([endpoint, data]) => ({
          endpoint,
          count: data.count,
          avgLatency: data.durations.reduce((s, d) => s + d, 0) / data.count,
          errorRate: (data.errors / data.count) * 100
        }))

        const statusMap: Record<string, number> = {}
        for (const m of metrics) {
          const statusClass = `${Math.floor(m.status / 100)}xx`
          statusMap[statusClass] = (statusMap[statusClass] || 0) + 1
        }

        const { count: pendingEvents } = await this.client
          .from('domain_events')
          .select('*', { count: 'exact', head: true })
          .eq('processed', false)

        const { count: processedEvents } = await this.client
          .from('domain_events')
          .select('*', { count: 'exact', head: true })
          .eq('processed', true)

        const { count: failedEvents } = await this.client
          .from('domain_events')
          .select('*', { count: 'exact', head: true })
          .gte('retry_count', 3)

        const memUsage = process.memoryUsage()
        const heapPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)

        const data: ServiceHealthData = {
          timestamp: new Date().toISOString(),
          api: {
            totalRequests,
            errorRate: totalRequests > 0 ? (errors.length / totalRequests) * 100 : 0,
            avgLatency: durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0,
            p95Latency: durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] || 0 : 0,
            p99Latency: durations.length > 0 ? durations[Math.floor(durations.length * 0.99)] || 0 : 0,
            requestsByStatus: statusMap,
            requestsByEndpoint
          },
          database: { avgQueryTime: 0, slowQueries: 0, connectionPoolUsage: 0, totalQueries: 0 },
          events: {
            pending: pendingEvents || 0,
            processed: processedEvents || 0,
            failed: failedEvents || 0,
            avgProcessingTime: 0
          },
          system: { uptime: process.uptime(), memoryUsage: heapPercent, cpuUsage: 0 }
        }

        return new Success(data)
      } catch (error) {
        logger.error('Failed to collect service health', error as Error)
        return new Failure(`Collection error: ${(error as Error).message}`)
      }
    })
  }

  async collectBusinessKPIs(periodDays: number = 30): Promise<Result<BusinessKPIData, string>> {
    return withSpan('DashboardCollector.businessKPIs', { period_days: periodDays }, async () => {
      try {
        const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

        const { data: orders } = await this.client
          .from('orders')
          .select('id, state, client_id, created_at, completed_at')
          .is('deleted_at', null)

        const allOrders = (orders as OrderRow[]) || []
        const periodOrders = allOrders.filter(o => new Date(o.created_at) >= periodStart)

        const byState: Record<string, number> = {}
        for (const o of allOrders) byState[o.state] = (byState[o.state] || 0) + 1

        const completedOrders = allOrders.filter(o => o.state === 'COMPLETED')
        const cancelledOrders = allOrders.filter(o => o.state === 'CANCELLED')

        let avgCompletionDays = 0
        if (completedOrders.length > 0) {
          const totalDays = completedOrders.reduce((sum, o) => {
            if (o.completed_at) {
              const days = (new Date(o.completed_at).getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24)
              return sum + days
            }
            return sum
          }, 0)
          avgCompletionDays = totalDays / completedOrders.length
        }

        const { data: pricing } = await this.client
          .from('order_pricing')
          .select('order_id, final_price, admin_commission, platform_fee, currency')

        const allPricing = (pricing as PricingRow[]) || []
        const totalRevenue = allPricing.reduce((sum, p) => sum + p.final_price, 0)
        const totalProfit = allPricing.reduce((sum, p) => sum + p.admin_commission + p.platform_fee, 0)

        const { data: quotations } = await this.client
          .from('quotations')
          .select('id, status, created_at')
          .is('deleted_at', null)

        const allQuotations = (quotations as QuotationRow[]) || []
        const approvedQuotes = allQuotations.filter(q => q.status === 'APPROVED')
        const rejectedQuotes = allQuotations.filter(q => q.status === 'REJECTED')

        const uniqueClients = new Set(allOrders.map(o => o.client_id))
        const activeClients = new Set(allOrders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.state)).map(o => o.client_id))

        const trend: Array<{ date: string; count: number }> = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date(); date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const count = periodOrders.filter(o => o.created_at.startsWith(dateStr)).length
          trend.push({ date: dateStr, count })
        }

        const data: BusinessKPIData = {
          timestamp: new Date().toISOString(),
          period: `last ${periodDays} days`,
          orders: {
            total: allOrders.length,
            active: allOrders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.state)).length,
            completed: completedOrders.length,
            cancelled: cancelledOrders.length,
            conversionRate: allOrders.length > 0 ? (completedOrders.length / allOrders.length) * 100 : 0,
            avgCompletionDays: Math.round(avgCompletionDays * 10) / 10,
            byState,
            trend
          },
          quotations: {
            total: allQuotations.length,
            approved: approvedQuotes.length,
            rejected: rejectedQuotes.length,
            approvalRate: allQuotations.length > 0 ? (approvedQuotes.length / allQuotations.length) * 100 : 0,
            avgResponseTime: 0,
            avgValue: totalRevenue / Math.max(1, completedOrders.length)
          },
          revenue: {
            total: Math.round(totalRevenue * 100) / 100,
            profit: Math.round(totalProfit * 100) / 100,
            profitMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0,
            currency: 'USD', trend: [], byProvider: []
          },
          clients: {
            total: uniqueClients.size,
            active: activeClients.size,
            newThisPeriod: periodOrders.length > 0 ? new Set(periodOrders.map(o => o.client_id)).size : 0,
            topClients: []
          }
        }
        return new Success(data)
      } catch (error) {
        logger.error('Failed to collect business KPIs', error as Error)
        return new Failure(`Collection error: ${(error as Error).message}`)
      }
    })
  }
}
