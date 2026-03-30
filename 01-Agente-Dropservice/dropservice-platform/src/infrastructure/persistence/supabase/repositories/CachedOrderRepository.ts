import {
  IOrderRepository,
  OrderQueryOptions,
  OrderListOptions,
  OrderListResult,
  EnrichedOrderDetail,
  DashboardStats
} from '@/core/application/ports/IOrderRepository';
import { Order } from '@/core/domain/aggregates/order/Order';
import { UniqueEntityID } from '@/core/shared/UniqueEntityID';
import { Result } from '@/core/shared/Result';
import { AppError } from '@/core/shared/AppError';
import { CacheManager, CacheTTL } from '@/infrastructure/cache/CacheManager';
import { CacheKeys, InvalidationPatterns } from '@/infrastructure/cache/CacheKeyBuilder';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';

/**
 * Decorator that wraps any IOrderRepository with caching.
 * 
 * Read operations → check cache first, fallback to inner repo.
 * Write operations → delegate to inner repo, then invalidate cache.
 */
export class CachedOrderRepository implements IOrderRepository {
  private readonly inner: IOrderRepository;
  private readonly cache: CacheManager;
  private readonly logger: StructuredLogger;

  constructor(deps: {
    inner: IOrderRepository;
    cache: CacheManager;
    logger: StructuredLogger;
  }) {
    this.inner = deps.inner;
    this.cache = deps.cache;
    this.logger = deps.logger.child({ component: 'CachedOrderRepository' });
  }

  // ── Write Operations (delegate + invalidate) ────────

  async save(order: Order): Promise<Result<void, AppError>> {
    const result = await this.inner.save(order);
    if (result.isFailure()) return result;

    // Invalidate all related caches
    const patterns = InvalidationPatterns.orderChanged(
      order.orderId.toString(),
      order.clientId.toString(),
      order.providerId?.toString(),
    );

    for (const pattern of patterns) {
      this.cache.invalidateByPrefix(pattern);
    }

    this.logger.debug('Cache invalidated after order save', {
      orderId: order.orderId.toString(),
      patternsInvalidated: patterns.length,
    });

    return result;
  }

  async delete(id: UniqueEntityID): Promise<Result<void, AppError>> {
    // Get context for invalidation before deleting
    const orderResult = await this.inner.findById(id);
    
    const result = await this.inner.delete(id);
    if (result.isFailure()) return result;

    if (orderResult.isSuccess() && orderResult.value) {
      const order = orderResult.value;
      const patterns = InvalidationPatterns.orderChanged(
        id.toString(),
        order.clientId.toString(),
        order.providerId?.toString(),
      );
      for (const pattern of patterns) {
        this.cache.invalidateByPrefix(pattern);
      }
    }

    // Also invalidate the specific order
    this.cache.delete(CacheKeys.orderDetail(id.toString()));
    this.cache.delete(CacheKeys.orderDetailEnriched(id.toString()));

    return result;
  }

  // ── Read Operations (cache-through) ────────────────

  async findById(id: UniqueEntityID): Promise<Result<Order | null, AppError>> {
    const key = CacheKeys.orderDetail(id.toString());

    return this.cache.getOrSet(
      key,
      () => this.inner.findById(id),
      { ttlMs: CacheTTL.STANDARD, tags: [`order:${id.toString()}`] },
    );
  }

  async findByClientIdEnriched(
    clientId: string,
    options: OrderListOptions = {},
  ): Promise<Result<OrderListResult, AppError>> {
    const key = CacheKeys.orderList('client', clientId, {
      page: options.page,
      limit: options.limit,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      status: options.status,
      search: options.search,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
    });

    return this.cache.getOrSet(
      key,
      () => this.inner.findByClientIdEnriched(clientId, options),
      {
        ttlMs: CacheTTL.SHORT,
        tags: [`client:${clientId}`, 'orders:list'],
      },
    );
  }

  async findByProviderIdEnriched(
    providerId: string,
    options: OrderListOptions = {},
  ): Promise<Result<OrderListResult, AppError>> {
    const key = CacheKeys.orderList('provider', providerId, {
      page: options.page,
      limit: options.limit,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      status: options.status,
    });

    return this.cache.getOrSet(
      key,
      () => this.inner.findByProviderIdEnriched(providerId, options),
      {
        ttlMs: CacheTTL.SHORT,
        tags: [`provider:${providerId}`, 'orders:list'],
      },
    );
  }

  async findAllEnriched(
    options: OrderListOptions = {},
  ): Promise<Result<OrderListResult, AppError>> {
    const key = CacheKeys.orderList('admin', 'all', {
      page: options.page,
      limit: options.limit,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      status: options.status,
      search: options.search,
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
    });

    return this.cache.getOrSet(
      key,
      () => this.inner.findAllEnriched(options),
      {
        ttlMs: CacheTTL.SHORT,
        tags: ['orders:list', 'admin'],
      },
    );
  }

  async findByIdEnriched(id: string): Promise<Result<EnrichedOrderDetail | null, AppError>> {
    const key = CacheKeys.orderDetailEnriched(id);

    return this.cache.getOrSet(
      key,
      () => this.inner.findByIdEnriched(id),
      {
        ttlMs: CacheTTL.STANDARD,
        tags: [`order:${id}`],
      },
    );
  }

  async getDashboardStats(): Promise<Result<DashboardStats, AppError>> {
    const key = CacheKeys.dashboardStats();

    return this.cache.getOrSet(
      key,
      () => this.inner.getDashboardStats(),
      {
        ttlMs: CacheTTL.SHORT,
        tags: ['dashboard'],
      },
    );
  }

  // ── Other IOrderRepository methods (proxied) ──────

  async query(options: OrderQueryOptions): Promise<Result<{ data: Order[]; total: number }, AppError>> {
    // We could cache this but query filters are complex. 
    // Usually better to use the Enriched methods for hot paths.
    return this.inner.query(options);
  }

  async findActiveOrdersByClient(clientId: UniqueEntityID): Promise<Result<Order[], AppError>> {
    return this.inner.findActiveOrdersByClient(clientId);
  }

  async findByProvider(providerId: UniqueEntityID): Promise<Result<Order[], AppError>> {
    return this.inner.findByProvider(providerId);
  }

  async findByState(state: string): Promise<Result<Order[], AppError>> {
    return this.inner.findByState(state);
  }

  async countActive(): Promise<Result<number, AppError>> {
    return this.inner.countActive();
  }

  async createFromQuotation(quotationId: string, price: number): Promise<Result<string, AppError>> {
    const result = await this.inner.createFromQuotation(quotationId, price);
    if (result.isSuccess()) {
      // Invalidate dashboard/lists as a new order might have been created
      this.cache.invalidateByPrefix('orders:list');
      this.cache.delete(CacheKeys.dashboardStats());
    }
    return result;
  }

  async getOrderWithBrief(orderId: string): Promise<Result<{
    id: string;
    quotationId: string;
    brief: string;
    requirements?: string;
  } | null, AppError>> {
    return this.inner.getOrderWithBrief(orderId);
  }

  async updateInternalNotes(orderId: string, notes: string): Promise<Result<void, AppError>> {
    return this.inner.updateInternalNotes(orderId, notes);
  }
}
