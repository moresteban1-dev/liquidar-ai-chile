import { Result, Success } from '@/core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { AdminDashboardResult } from '../queries/AdminDashboardQuery'

export class AdminDashboardHandler
  extends InstrumentedHandler<void, AdminDashboardResult> {

  protected handlerName = 'AdminDashboard'
  protected operationType = 'query' as const

  constructor(private readonly orderRepository: IOrderRepository) {
    super()
  }

  protected async handle(): Promise<Result<AdminDashboardResult, string>> {
    // 1. Get aggregated stats in a single RPC call (N+1 eliminated)
    const statsResult = await this.orderRepository.getDashboardStats()
    if (statsResult.isFailure()) return statsResult as any
    const stats = statsResult.getValue()

    // 2. Get recent orders with enriched data (JOINs used)
    const recentResult = await this.orderRepository.findAllEnriched({
      limit: 10,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    const recentOrders = recentResult.isSuccess() ? recentResult.getValue().orders.map(order => ({
      id: order.orderId.toString(),
      clientId: order.clientId.toString(),
      state: order.state,
      eventDate: order.eventDate.toISOString(),
      finalPrice: order.pricing?.finalPrice.amount,
      createdAt: order.createdAt.toISOString()
    })) : []

    // 3. Get upcoming events (single query)
    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const upcomingResult = await this.orderRepository.findAllEnriched({
      dateFrom: now.toISOString(),
      dateTo: sevenDaysFromNow.toISOString(),
      activeOnly: true,
      sortBy: 'event_date',
      sortOrder: 'asc',
      limit: 20
    })

    const upcomingEvents = upcomingResult.isSuccess() ? upcomingResult.getValue().orders.map(order => ({
      id: order.orderId.toString(),
      eventDate: order.eventDate.toISOString(),
      daysUntil: order.daysUntilEvent,
      state: order.state,
      deliveryAddress: order.deliveryAddress
    })) : []

    // 4. Transform to Result DTO
    return new Success({
      summary: {
        totalOrders: stats.totalOrders,
        activeOrders: stats.totalOrders - ( (stats.byStatus['COMPLETED'] || 0) + (stats.byStatus['CANCELLED'] || 0) ),
        completedOrders: stats.byStatus['COMPLETED'] || 0,
        cancelledOrders: stats.byStatus['CANCELLED'] || 0,
        totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
        totalProfit: Math.round(stats.totalProfit * 100) / 100,
        currency: 'USD'
      },
      ordersByState: stats.byStatus,
      recentOrders,
      upcomingEvents
    })
  }

  protected extractSpanAttributes() {
    return { 'dashboard.type': 'admin' }
  }
}
