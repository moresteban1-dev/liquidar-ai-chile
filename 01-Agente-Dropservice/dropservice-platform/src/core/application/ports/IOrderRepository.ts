import { Order } from '@/core/domain/aggregates/order/Order'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { Result } from '@/core/shared/Result'
import { AppError } from '@/core/shared/AppError'

/**
 * IOrderRepository - Updated with query support
 */

export interface OrderQueryFilters {
  state?: string
  clientId?: string
  providerId?: string
  eventDateFrom?: Date
  eventDateTo?: Date
  hasProvider?: boolean
  activeOnly?: boolean
}

export interface OrderQueryOptions {
  filters?: OrderQueryFilters
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface OrderListOptions {
  readonly page?: number
  readonly limit?: number
  readonly sortBy?: string
  readonly sortOrder?: 'asc' | 'desc'
  readonly status?: string
  readonly search?: string
  readonly dateFrom?: string
  readonly dateTo?: string
  readonly activeOnly?: boolean
}

export interface OrderListResult {
  readonly orders: Order[]
  readonly total: number
  readonly limit: number
  readonly offset: number
}

export interface EnrichedOrderDetail {
  readonly order: Order
  readonly client: { name: string; email: string } | null
  readonly provider: { name: string; company: string } | null
  readonly quotations: Array<{
    id: string
    status: string
    providerCost: number
    adminMargin: number
    clientPrice: number
    currency: string
    createdAt: string
  }>
}

export interface DashboardStats {
  readonly totalOrders: number
  readonly byStatus: Record<string, number>
  readonly totalRevenue: number
  readonly totalProfit: number
  readonly avgOrderValue: number
  readonly recentOrders: number
  readonly pendingQuotations: number
  readonly activeProviders: number
}

export interface IOrderRepository {
  findById(id: UniqueEntityID): Promise<Result<Order | null, AppError>>
  save(order: Order): Promise<Result<void, AppError>>
  delete(id: UniqueEntityID): Promise<Result<void, AppError>>

  // Optimized query method (server-side filtering)
  query(options: OrderQueryOptions): Promise<Result<{
    data: Order[]
    total: number
  }, AppError>>

  // Enriched queries (N+1 free)
  findByClientIdEnriched(
    clientId: string,
    options?: OrderListOptions,
  ): Promise<Result<OrderListResult, AppError>>

  findByProviderIdEnriched(
    providerId: string,
    options?: OrderListOptions,
  ): Promise<Result<OrderListResult, AppError>>

  findAllEnriched(
    options?: OrderListOptions,
  ): Promise<Result<OrderListResult, AppError>>

  findByIdEnriched(id: string): Promise<Result<EnrichedOrderDetail | null, AppError>>

  getDashboardStats(): Promise<Result<DashboardStats, AppError>>

  // Legacy/Helper methods
  findActiveOrdersByClient(clientId: UniqueEntityID): Promise<Result<Order[], AppError>>
  findByProvider(providerId: UniqueEntityID): Promise<Result<Order[], AppError>>
  findByState(state: string): Promise<Result<Order[], AppError>>
  countActive(): Promise<Result<number, AppError>>
  createFromQuotation(quotationId: string, price: number): Promise<Result<string, AppError>>

  /**
   * Retrieves an order with its quotation brief for AI analysis.
   */
  getOrderWithBrief(orderId: string): Promise<Result<{
    id: string;
    quotationId: string;
    brief: string;
    requirements?: string;
  } | null, AppError>>;

  /**
   * Updates internal notes for an order.
   */
  updateInternalNotes(orderId: string, notes: string): Promise<Result<void, AppError>>;
}
