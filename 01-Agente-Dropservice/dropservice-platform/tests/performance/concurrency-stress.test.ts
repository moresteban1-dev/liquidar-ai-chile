import { createTestContainer, TestContainer } from '../setup/test-container';
import { createTestOrder, TEST_IDS } from '../setup/test-factories';
import { TransitionOrderStateHandler } from '@core/application/handlers/TransitionOrderStateHandler';
import { CreateOrderHandler } from '@core/application/handlers/order/CreateOrderUseCase';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

describe('Concurrency Stress Tests', () => {
  let ctx: TestContainer;

  beforeEach(() => {
    ctx = createTestContainer();
  });

  it('should handle multiple concurrent order creations without data loss', async () => {
    const handler = new CreateOrderHandler(ctx.orderRepo, ctx.eventPublisher);

    const promises = Array.from({ length: 20 }, (_, i) =>
      handler.execute({
        clientId: TEST_IDS.client,
        eventDate: '2026-12-01T10:00:00Z',
        deliveryAddress: `Stress Road ${i}`
      }),
    );

    const results = await Promise.allSettled(promises);

    const successes = results.filter(
      (r) => r.status === 'fulfilled' && r.value.isSuccess(),
    );
    
    expect(successes.length).toBe(20);
    expect(ctx.orderRepo.count).toBe(20);
    expect(ctx.eventPublisher.publishedCount).toBe(20);
  });

  it('should maintain consistency on simultaneous state transitions', async () => {
    const order = createTestOrder({
      id: 'race-order',
      state: 'QUOTATION_PENDING',
    });
    ctx.orderRepo.seed([order]);

    const handler = new TransitionOrderStateHandler(ctx.orderRepo, ctx.eventPublisher);

    const [result1, result2] = await Promise.allSettled([
      handler.execute({ orderId: 'race-order', newState: 'QUOTATION_SENT', performedBy: TEST_IDS.admin, performedByRole: 'admin' }),
      handler.execute({ orderId: 'race-order', newState: 'CANCELLED', reason: 'Stress test', performedBy: TEST_IDS.admin, performedByRole: 'admin' }),
    ]);

    // At least one should succeed (the one that hits first)
    const anySucceeded = [result1, result2].some(
      (r) => r.status === 'fulfilled' && r.value.isSuccess(),
    );
    expect(anySucceeded).toBe(true);

    // Verify final state using Result API (findById returns Result<Order|null>)
    const findResult = await ctx.orderRepo.findById(new UniqueEntityID('race-order'));
    expect(findResult.isSuccess()).toBe(true);
    const finalOrder = findResult.unwrap();
    expect(finalOrder).not.toBeNull();
    expect(['QUOTATION_SENT', 'CANCELLED']).toContain(finalOrder!.state);
  });
});
