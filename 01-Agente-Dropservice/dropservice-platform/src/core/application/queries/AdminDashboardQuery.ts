/**
 * AdminDashboardResult - Datos del dashboard administrativo
 */

export interface AdminDashboardResult {
  summary: {
    totalOrders: number
    activeOrders: number
    completedOrders: number
    cancelledOrders: number
    totalRevenue: number
    totalProfit: number
    currency: string
  }
  ordersByState: Record<string, number>
  recentOrders: Array<{
    id: string
    clientId: string
    state: string
    eventDate: string
    finalPrice?: number
    createdAt: string
  }>
  upcomingEvents: Array<{
    id: string
    eventDate: string
    daysUntil: number
    state: string
    deliveryAddress: string
  }>
}
