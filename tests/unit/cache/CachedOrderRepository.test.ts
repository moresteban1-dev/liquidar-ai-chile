import { CachedOrderRepository } from '@/infrastructure/persistence/supabase/repositories/CachedOrderRepository';
import { IOrderRepository } from '@/core/application/ports/repositories/IOrderRepository';
import { CacheManager } from '@/infrastructure/cache/CacheManager';
import { UniqueEntityID } from '@/core/shared/UniqueEntityID';
import { Result } from '@/core/shared/Result';
import { Order } from '@/core/domain/aggregates/order/Order';

describe('CachedOrderRepository', () => {
  let repository: CachedOrderRepository;
  let innerRepo: IOrderRepository;
  let cache: CacheManager;
  let logger: any;

  beforeEach(() => {
    innerRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findByClientIdEnriched: vi.fn(),
      getDashboardStats: vi.fn(),
    } as any;

    logger = {
      child: vi.fn().mockReturnThis(),
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    cache = {
      getOrSet: vi.fn(),
      invalidateByPrefix: vi.fn(),
      delete: vi.fn(),
      set: vi.fn(),
      get: vi.fn(),
    } as any;

    repository = new CachedOrderRepository({
      inner: innerRepo,
      cache,
      logger
    });
  });

  it('should call inner.findById on cache miss', async () => {
    const id = new UniqueEntityID('order-1');
    const order = { id } as any;
    
    // Mock getOrSet to call the factory
    (cache.getOrSet as any).mockImplementation((key: string, factory: any) => factory());
    (innerRepo.findById as any).mockResolvedValue(Result.ok(order));

    const result = await repository.findById(id);

    expect(result.value).toBe(order);
    expect(innerRepo.findById).toHaveBeenCalledWith(id);
    expect(cache.getOrSet).toHaveBeenCalled();
  });

  it('should invalidate cache on save', async () => {
    const order = {
      orderId: new UniqueEntityID('o1'),
      clientId: new UniqueEntityID('c1'),
      providerId: new UniqueEntityID('p1'),
    } as any;

    (innerRepo.save as any).mockResolvedValue(Result.ok());

    await repository.save(order);

    expect(innerRepo.save).toHaveBeenCalledWith(order);
    expect(cache.invalidateByPrefix).toHaveBeenCalled();
  });

  it('should cache dashboard stats', async () => {
    const stats = { totalOrders: 10 } as any;
    (cache.getOrSet as any).mockImplementation((key: string, factory: any) => factory());
    (innerRepo.getDashboardStats as any).mockResolvedValue(Result.ok(stats));

    const result = await repository.getDashboardStats();

    expect(result.value).toBe(stats);
    expect(innerRepo.getDashboardStats).toHaveBeenCalled();
    expect(cache.getOrSet).toHaveBeenCalledWith(
      expect.stringContaining('dashboard:stats'),
      expect.any(Function),
      expect.objectContaining({ tags: ['dashboard'] })
    );
  });
});
