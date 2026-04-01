import { createTestContainer, TestContainer } from '../setup/test-container';
import { createTestOrder, TEST_IDS } from '../setup/test-factories';
import { CreateOrderHandler } from '@/core/application/handlers/CreateOrderHandler';
import { GetOrderByIdHandler } from '@/core/application/handlers/GetOrderByIdHandler';
import { ListOrdersByClientHandler } from '@/core/application/handlers/ListOrdersByClientHandler';
import { TransitionOrderStateHandler } from '@/core/application/handlers/TransitionOrderStateHandler';

// ═══════════════════════════════════════════════════════════
// Performance thresholds (NASA mission requirements)
// ═══════════════════════════════════════════════════════════

const THRESHOLDS = {
  createOrder: { p50: 10, p95: 50, p99: 100 },      // ms (adjusted for GH Actions/Local env variance)
  getOrderById: { p50: 5, p95: 20, p99: 40 },
  listOrders: { p50: 20, p95: 60, p99: 120 },
  transitionState: { p50: 10, p95: 40, p99: 80 },
} as const;

function runBenchmark(
  fn: () => Promise<void>,
  iterations: number,
): Promise<{ p50: number; p95: number; p99: number; mean: number; min: number; max: number }> {
  return new Promise(async (resolve) => {
    const durations: number[] = [];

    // Warm-up
    for (let i = 0; i < 5; i++) {
        await fn();
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      durations.push(performance.now() - start);
    }

    durations.sort((a, b) => a - b);

    resolve({
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      mean: durations.reduce((s, d) => s + d, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
    });
  });
}

describe('Handler Performance Benchmarks', () => {
  let ctx: TestContainer;

  beforeEach(() => {
    ctx = createTestContainer();
  });

  describe('CreateOrderHandler', () => {
    it(`should create orders within P95 < ${THRESHOLDS.createOrder.p95}ms`, async () => {
      const handler = new CreateOrderHandler(ctx.orderRepo, ctx.eventPublisher);

      const result = await runBenchmark(async () => {
        await handler.execute({
          clientId: TEST_IDS.client,
          eventDate: '2026-12-01T10:00:00Z',
          deliveryAddress: 'Benchmark Ave 1',
        });
      }, 50);

      expect(result.p95).toBeLessThan(THRESHOLDS.createOrder.p95);
    });
  });

  describe('ListOrdersByClientHandler', () => {
    it(`should list orders within P95 < ${THRESHOLDS.listOrders.p95}ms with 50 orders`, async () => {
      const orders = Array.from({ length: 50 }, (_, i) =>
        createTestOrder({
          id: `bench-order-${i}`,
          clientId: TEST_IDS.client
        }),
      );
      ctx.orderRepo.seed(orders);

      const handler = new ListOrdersByClientHandler(ctx.orderRepo);

      const result = await runBenchmark(async () => {
        await handler.execute({
          clientId: TEST_IDS.client,
          pagination: { page: 1, pageSize: 10 }
        });
      }, 50);

      expect(result.p95).toBeLessThan(THRESHOLDS.listOrders.p95);
    });
  });
});
