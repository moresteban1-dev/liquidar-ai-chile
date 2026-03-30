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

export class InMemoryOrderRepository implements IOrderRepository {
  private orders = new Map<string, Order>()
  public shouldFail = false

  async findById(id: UniqueEntityID): Promise<Result<Order | null, string>> {
    if (this.shouldFail) return new Failure('Repository error')
    return new Success(this.orders.get(id.toString()) || null)
  }

  async save(order: Order): Promise<Result<void, string>> {
    if (this.shouldFail) return new Failure('Repository error')
    this.orders.set(order.orderId.toString(), order)
    return new Success(undefined)
  }

  async delete(id: UniqueEntityID): Promise<Result<void, string>> {
    if (this.shouldFail) return new Failure('Repository error')
    this.orders.delete(id.toString())
    return new Success(undefined)
  }

  async query(options: OrderQueryOptions): Promise<Result<{ data: Order[]; total: number }, string>> {
    if (this.shouldFail) return new Failure('Repository error')
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

  async findByClientIdEnriched(clientId: string, options?: OrderListOptions): Promise<Result<OrderListResult, string>> {
    const res = await this.query({ filters: { clientId }, page: options?.page, pageSize: options?.limit })
    if (res.isFailure()) return new Failure(res.error)
    return new Success({
      orders: res.value.data,
      total: res.value.total,
      limit: options?.limit || 20,
      offset: ((options?.page || 1) - 1) * (options?.limit || 20)
    })
  }

  async findByProviderIdEnriched(providerId: string, options?: OrderListOptions): Promise<Result<OrderListResult, string>> {
    const res = await this.query({ filters: { providerId }, page: options?.page, pageSize: options?.limit })
    if (res.isFailure()) return new Failure(res.error)
    return new Success({
      orders: res.value.data,
      total: res.value.total,
      limit: options?.limit || 20,
      offset: ((options?.page || 1) - 1) * (options?.limit || 20)
    })
  }

  async findAllEnriched(options?: OrderListOptions): Promise<Result<OrderListResult, string>> {
    const res = await this.query({ page: options?.page, pageSize: options?.limit })
    if (res.isFailure()) return new Failure(res.error)
    return new Success({
      orders: res.value.data,
      total: res.value.total,
      limit: options?.limit || 20,
      offset: ((options?.page || 1) - 1) * (options?.limit || 20)
    })
  }

  async findByIdEnriched(id: string): Promise<Result<EnrichedOrderDetail | null, string>> {
    const order = this.orders.get(id)
    if (!order) return new Success(null)
    return new Success({
      order,
      client: null,
      provider: null,
      quotations: []
    })
  }

  async getDashboardStats(): Promise<Result<DashboardStats, string>> {
    return new Success({
      totalOrders: this.orders.size,
      byStatus: {},
      totalRevenue: 0,
      totalProfit: 0,
      avgOrderValue: 0,
      recentOrders: 0,
      pendingQuotations: 0,
      activeProviders: 0
    })
  }

  async findActiveOrdersByClient(clientId: UniqueEntityID): Promise<Result<Order[], string>> {
    const res = await this.query({ filters: { clientId: clientId.toString(), activeOnly: true }, pageSize: 100 })
    return res.map(r => r.data)
  }

  async findByProvider(providerId: UniqueEntityID): Promise<Result<Order[], string>> {
    const res = await this.query({ filters: { providerId: providerId.toString() }, pageSize: 100 })
    return res.map(r => r.data)
  }

  async findByState(state: string): Promise<Result<Order[], string>> {
    const res = await this.query({ filters: { state }, pageSize: 100 })
    return res.map(r => r.data)
  }

  async countActive(): Promise<Result<number, string>> {
    return new Success(Array.from(this.orders.values()).filter(o => o.isActive).length)
  }

  async createFromQuotation(_quotationId: string, _price: number): Promise<Result<string, string>> {
    return new Success('new-order-id')
  }
}
