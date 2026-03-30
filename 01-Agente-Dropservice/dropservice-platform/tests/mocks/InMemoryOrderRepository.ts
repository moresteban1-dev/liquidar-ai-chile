import { IOrderRepository, OrderQueryOptions, OrderListOptions, OrderListResult, EnrichedOrderDetail, DashboardStats } from '@/core/application/ports/repositories/IOrderRepository';
import { Order } from '@/core/domain/aggregates/order/Order';
import { Result } from '@/core/shared/Result';
import { UniqueEntityID } from '@/core/shared/UniqueEntityID';

export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, Order> = new Map();
  public saveCallCount = 0;
  public findByIdCallCount = 0;

  async save(order: Order): Promise<Result<void, string>> {
    this.orders.set(order.id.toString(), order);
    this.saveCallCount++;
    return Result.ok(undefined);
  }

  async findById(id: UniqueEntityID): Promise<Result<Order | null, string>> {
    this.findByIdCallCount++;
    const order = this.orders.get(id.toString());
    return Result.ok(order ?? null);
  }

  async delete(id: UniqueEntityID): Promise<Result<void, string>> {
    this.orders.delete(id.toString());
    return Result.ok(undefined);
  }

  async query(options: OrderQueryOptions): Promise<Result<{ data: Order[]; total: number }, string>> {
    let all = Array.from(this.orders.values());

    if (options.filters) {
      if (options.filters.clientId) {
        all = all.filter(o => o.clientId.toString() === options.filters?.clientId);
      }
      if (options.filters.providerId) {
        all = all.filter(o => o.providerId?.toString() === options.filters?.providerId);
      }
      if (options.filters.state) {
        all = all.filter(o => o.state === options.filters?.state);
      }
    }

    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    return Result.ok({
      data: all.slice(offset, offset + pageSize),
      total: all.length
    });
  }

  async findActiveOrdersByClient(clientId: UniqueEntityID): Promise<Result<Order[], string>> {
    const orders = Array.from(this.orders.values()).filter(
      (o) => o.clientId.equals(clientId) && o.isActive
    );
    return Result.ok(orders);
  }

  async findByProvider(providerId: UniqueEntityID): Promise<Result<Order[], string>> {
      const orders = Array.from(this.orders.values()).filter(
          (o) => o.providerId?.equals(providerId)
      );
      return Result.ok(orders);
  }

  async findByState(state: string): Promise<Result<Order[], string>> {
      const orders = Array.from(this.orders.values()).filter(
          (o) => o.state === state
      );
      return Result.ok(orders);
  }

  async countActive(): Promise<Result<number, string>> {
      const count = Array.from(this.orders.values()).filter(o => o.isActive).length;
      return Result.ok(count);
  }

  // ── Enriched Query Methods (in-memory stubs) ──

  async findByClientIdEnriched(
    clientId: string,
    options?: OrderListOptions,
  ): Promise<Result<OrderListResult, string>> {
    const all = Array.from(this.orders.values()).filter(
      (o) => o.clientId.toString() === clientId
    );

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const offset = (page - 1) * limit;
    const sliced = all.slice(offset, offset + limit);

    return Result.ok({
      orders: sliced,
      total: all.length,
      limit,
      offset,
    });
  }

  async findByProviderIdEnriched(
    providerId: string,
    options?: OrderListOptions,
  ): Promise<Result<OrderListResult, string>> {
    const all = Array.from(this.orders.values()).filter(
      (o) => o.providerId?.toString() === providerId
    );

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const offset = (page - 1) * limit;

    return Result.ok({
      orders: all.slice(offset, offset + limit),
      total: all.length,
      limit,
      offset,
    });
  }

  async findAllEnriched(
    options?: OrderListOptions,
  ): Promise<Result<OrderListResult, string>> {
    const all = Array.from(this.orders.values());

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const offset = (page - 1) * limit;

    return Result.ok({
      orders: all.slice(offset, offset + limit),
      total: all.length,
      limit,
      offset,
    });
  }

  async findByIdEnriched(id: string): Promise<Result<EnrichedOrderDetail | null, string>> {
    const order = this.orders.get(id);
    if (!order) return Result.ok(null);

    return Result.ok({
      order,
      client: null,
      provider: null,
      quotations: [],
    });
  }

  async getDashboardStats(): Promise<Result<DashboardStats, string>> {
    const all = Array.from(this.orders.values());
    const byStatus: Record<string, number> = {};
    for (const o of all) {
      byStatus[o.state] = (byStatus[o.state] || 0) + 1;
    }

    return Result.ok({
      totalOrders: all.length,
      byStatus,
      totalRevenue: 0,
      totalProfit: 0,
      avgOrderValue: 0,
      recentOrders: all.length,
      pendingQuotations: byStatus['QUOTATION_PENDING'] || 0,
      activeProviders: 0,
    });
  }

  async createFromQuotation(quotationId: string, _price: number): Promise<Result<string, string>> {
    const id = new UniqueEntityID().toString();
    return Result.ok(id);
  }

  // ── Test Helpers ──

  reset(): void {
    this.orders.clear();
    this.saveCallCount = 0;
    this.findByIdCallCount = 0;
  }

  seed(orders: Order[]): void {
    for (const order of orders) {
      this.orders.set(order.id.toString(), order);
    }
  }

  get count(): number {
    return this.orders.size;
  }

  getAll(): Order[] {
    return Array.from(this.orders.values());
  }
}
