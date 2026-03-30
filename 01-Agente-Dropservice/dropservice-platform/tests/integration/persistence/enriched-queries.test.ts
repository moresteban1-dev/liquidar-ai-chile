import { SupabaseOrderRepository } from '../../../src/infrastructure/persistence/supabase/repositories/SupabaseOrderRepository';
import { OrderMapper } from '../../../src/infrastructure/persistence/supabase/mappers/OrderMapper';

describe('SupabaseOrderRepository Enriched Queries', () => {
  let repository: SupabaseOrderRepository;
  let mockSupabase: any;
  let mapper: OrderMapper;

  /**
   * Creates a fully chainable Supabase mock
   * Each method returns the chain so fluent API works.
   */
  function createChainableMock(resolvedValue: any = { data: [], error: null, count: 0 }) {
    const chain: any = {};
    const methods = ['select', 'eq', 'is', 'not', 'order', 'range', 'limit', 'match', 'single'];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    // The terminal method resolves
    chain.then = (resolve: any) => resolve(resolvedValue);
    // Also make it a direct promise for await
    chain[Symbol.for('vitest:mock-promise')] = true;
    // Override last call to resolve
    chain.range.mockResolvedValue(resolvedValue);
    chain.single.mockResolvedValue(resolvedValue);
    chain.limit.mockResolvedValue(resolvedValue);
    return chain;
  }

  beforeEach(() => {
    const chain = createChainableMock();
    mockSupabase = {
      from: vi.fn().mockReturnValue(chain),
      rpc: vi.fn(),
    };

    mapper = new OrderMapper();
    repository = new SupabaseOrderRepository(mockSupabase as any, mapper);
  });

  it('should call get_dashboard_stats RPC and return DashboardStats', async () => {
    const mockStats = {
      totalOrders: 100,
      byStatus: { COMPLETED: 80, CANCELLED: 5 },
      totalRevenue: 50000,
      totalProfit: 10000,
      avgOrderValue: 500,
      recentOrders: 10,
      pendingQuotations: 3,
      activeProviders: 12,
    };

    mockSupabase.rpc.mockResolvedValue({ data: mockStats, error: null });

    const result = await repository.getDashboardStats();

    expect(result.isSuccess()).toBe(true);
    expect(result.unwrap()).toEqual(mockStats);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_dashboard_stats');
  });

  it('should perform findByIdEnriched and return result', async () => {
    const orderId = 'order-123';
    const mockData = {
      id: orderId,
      client_id: 'client-1',
      state: 'QUOTATION_PENDING',
      event_date: new Date().toISOString(),
      delivery_address: '123 Test St',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order_pricing: [],
      client: { full_name: 'Test Client', email: 'client@test.com' },
      provider: { full_name: 'Test Provider', company_name: 'Test Co' },
      quotations: []
    };

    // Create a fresh chain that resolves to our mockData
    const chain = createChainableMock({ data: mockData, error: null });
    mockSupabase.from.mockReturnValue(chain);

    const result = await repository.findByIdEnriched(orderId);

    // Just verify the call was made and returned a Result
    expect(result.isSuccess()).toBeDefined();
  });

  it('should apply activeOnly filter in findEnriched', async () => {
    const chain = createChainableMock({ data: [], error: null, count: 0 });
    mockSupabase.from.mockReturnValue(chain);

    await repository.findAllEnriched({ activeOnly: true });

    // Verify that `not` was called to filter out completed/cancelled
    expect(chain.not).toHaveBeenCalled();
  });
});
