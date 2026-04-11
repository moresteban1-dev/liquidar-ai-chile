import { Order } from '@/core/domain/aggregates/order/Order'
import { 
  IOrderRepository, 
  OrderQueryOptions, 
  OrderListOptions, 
  OrderListResult,
  EnrichedOrderDetail,
  DashboardStats
} from '@app/ports/IOrderRepository';
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { Result, Success, Failure } from '@/core/shared/Result'
import { AppError } from '@/core/shared/AppError'

export class InMemoryOrderRepository implements IOrderRepository {
  private orders = new Map<string, Order>()
  public shouldFail = false

  async findById(id: UniqueEntityID): Promise<Result<Order | null, AppError>> {
    if (this.shouldFail) return new Failure(AppError.internal('Repository error'))
    return new Success(this.orders.get(id.toString()) || null)
  }

  async save(order: Order): Promise<Result<void, AppError>> {
    if (this.shouldFail) return new Failure(AppError.internal('Repository error'))
    this.orders.set(order.orderId.toString(), order)
    return new Success(undefined)
  }

  async delete(id: UniqueEntityID): Promise<Result<void, AppError>> {
    if (this.shouldFail) return new Failure(AppError.internal('Repository error'))
    this.orders.delete(id.toString())
    return new Success(undefined)
  }

  async query(options: OrderQueryOptions): Promise<Result<{ data: Order[]; total: number }, AppError>> {
    if (this.shouldFail) return new Failure(AppError.internal('Repository error'))
    let orders = Array.from(this.orders.values())

    if (options.filters) {
      const f = options.filters
      if (f.state) orders = orders.filter(o => o.state === f.state)
      if (f.clientId) orders = orders.filter(o => o.clientId.toString() === f.clientId)
      if (f.providerId) orders = orders.filter(o => o.providerId?.toString() === f.providerId)
      if (f.activeOnly) orders = orders.filter(o => o.isActive)
      if (f.hasProvider === true) orders = orders.filter(o => !!o.providerId)
      else if (f.hasProvider === false) orders = orders.filter(o => !o.providerId)
    }

    const total = orders.length
    const page = options.page || 1
    const pageSize = options.pageSize || 20
    const offset = (page - 1) * pageSize
    return new Success({ data: orders.slice(offset, offset + pageSize), total })
  }

  async findByClientIdEnriched(clientId: string, options?: OrderListOptions): Promise<Result<OrderListResult, AppError>> {
    const res = await this.query({ filters: { clientId }, page: options?.page, pageSize: options?.limit })
    if (res.isFailure()) return new Failure(res.error)
    return new Success({
      orders: res.value.data,
      total: res.value.total,
      limit: options?.limit || 20,
      offset: ((options?.page || 1) - 1) * (options?.limit || 20)
    })
  }

  async findByProviderIdEnriched(providerId: string, options?: OrderListOptions): Promise<Result<OrderListResult, AppError>> {
    const res = await this.query({ filters: { providerId }, page: options?.page, pageSize: options?.limit })
    if (res.isFailure()) return new Failure(res.error)
    return new Success({
      orders: res.value.data,
      total: res.value.total,
      limit: options?.limit || 20,
      offset: ((options?.page || 1) - 1) * (options?.limit || 20)
    })
  }

  async findAllEnriched(options?: OrderListOptions): Promise<Result<OrderListResult, AppError>> {
    const res = await this.query({ page: options?.page, pageSize: options?.limit })
    if (res.isFailure()) return new Failure(res.error)
    return new Success({
      orders: res.value.data,
      total: res.value.total,
      limit: options?.limit || 20,
      offset: ((options?.page || 1) - 1) * (options?.limit || 20)
    })
  }

  async findByIdEnriched(id: string): Promise<Result<EnrichedOrderDetail | null, AppError>> {
    const order = this.orders.get(id)
    if (!order) return new Success(null)
    return new Success({
      order,
      client: null,
      provider: null,
      quotations: []
    })
  }

  async getDashboardStats(): Promise<Result<DashboardStats, AppError>> {
    const orders = Array.from(this.orders.values());
    const byStatus: Record<string, number> = {};
    let totalRevenue = 0;
    let totalProfit = 0;

    for (const order of orders) {
      const state = order.state;
      byStatus[state] = (byStatus[state] || 0) + 1;

      if (order.isPaid && order.pricing) {
        totalRevenue += order.pricing.finalPrice.amount;
        totalProfit += order.pricing.totalCommission.amount;
      }
    }

    return new Success({
      totalOrders: orders.length,
      byStatus,
      totalRevenue,
      totalProfit,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      recentOrders: orders.filter(o => {
        const diff = Date.now() - o.createdAt.getTime();
        return diff < 1000 * 60 * 60 * 24 * 7; // Last 7 days
      }).length,
      pendingQuotations: orders.filter(o => o.state === 'QUOTATION_PENDING').length,
      activeProviders: new Set(orders.map(o => o.providerId?.toString()).filter(Boolean)).size
    });
  }

  async findActiveOrdersByClient(clientId: UniqueEntityID): Promise<Result<Order[], AppError>> {
    const res = await this.query({ filters: { clientId: clientId.toString(), activeOnly: true }, pageSize: 100 })
    if (res.isFailure()) return new Failure(res.error)
    return new Success(res.value.data)
  }

  async findByProvider(providerId: UniqueEntityID): Promise<Result<Order[], AppError>> {
    const res = await this.query({ filters: { providerId: providerId.toString() }, pageSize: 100 })
    if (res.isFailure()) return new Failure(res.error)
    return new Success(res.value.data)
  }

  async findByState(state: string): Promise<Result<Order[], AppError>> {
    const res = await this.query({ filters: { state }, pageSize: 100 })
    if (res.isFailure()) return new Failure(res.error)
    return new Success(res.value.data)
  }

  async countActive(): Promise<Result<number, AppError>> {
    return new Success(Array.from(this.orders.values()).filter(o => o.isActive).length)
  }

  async createFromQuotation(_quotationId: string, _price: number): Promise<Result<string, AppError>> {
    return new Success('new-order-id')
  }

  async getOrderWithBrief(orderId: string): Promise<Result<{
    id: string;
    quotationId: string;
    brief: string;
    requirements?: string;
  } | null, AppError>> {
    const order = this.orders.get(orderId)
    if (!order) return new Success(null)
    return new Success({
      id: orderId,
      quotationId: 'mock-quotation-id',
      brief: 'Mock brief content',
      requirements: order.deliveryAddress
    })
  }

  async updateInternalNotes(orderId: string, notes: string): Promise<Result<void, AppError>> {
    if (this.shouldFail) return new Failure(AppError.internal('Repository error'))
    return new Success(undefined)
  }
}
