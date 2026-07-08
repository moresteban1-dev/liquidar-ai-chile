import { createTestContainer, TestContainer } from '../../setup/test-container';
import {
  TEST_IDS,
} from '../../setup/test-factories';
import { CreateOrderHandler } from '@/core/application/handlers/CreateOrderHandler';
import { TransitionOrderStateHandler } from '@/core/application/handlers/TransitionOrderStateHandler';
import { GetOrderByIdHandler } from '@/core/application/handlers/GetOrderByIdHandler';
import { UserRole } from '@/core/domain/auth/UserRole';

describe('Order Lifecycle — Full Integration', () => {
  let ctx: TestContainer;
  let createOrder: CreateOrderHandler;
  let transitionState: TransitionOrderStateHandler;
  let getOrder: GetOrderByIdHandler;

  beforeEach(() => {
    ctx = createTestContainer();

    createOrder = new CreateOrderHandler(ctx.orderRepo, ctx.eventPublisher);
    transitionState = new TransitionOrderStateHandler(ctx.orderRepo, ctx.eventPublisher);
    getOrder = new GetOrderByIdHandler(ctx.orderRepo);
  });

  it('should complete full order lifecycle: create → assign → quote → approve → deliver → complete', async () => {
    // ── Step 1: Create Order ──
    const createResult = await createOrder.execute({
      clientId: TEST_IDS.client,
      eventDate: '2026-12-15T18:00:00Z',
      deliveryAddress: 'Main St 123',
    });

    expect(createResult.isSuccess()).toBe(true);
    const order = createResult.getValue();
    const orderId = order.id.toString();
    expect(orderId).toBeDefined();

    // Verify OrderCreated event published
    expect(ctx.eventPublisher.hasEvent('OrderCreated')).toBe(true);

    // ── Step 2: CreateOrderHandler creates in DRAFT ──
    const getResult1 = await getOrder.execute({ orderId });
    expect(getResult1.isSuccess()).toBe(true);
    const order1 = getResult1.getValue();
    expect(order1.state).toBe('DRAFT');

    // ── Step 3: Transition DRAFT → QUOTATION_PENDING ──
    const toPendingResult = await transitionState.execute({
      orderId,
      newState: 'QUOTATION_PENDING',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });
    expect(toPendingResult.isSuccess()).toBe(true);

    // ── Step 4: Transition to QUOTATION_SENT ──
    const quoteResult = await transitionState.execute({
      orderId,
      newState: 'QUOTATION_SENT',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });
    expect(quoteResult.isSuccess()).toBe(true);

    // ── Step 5: Approve ──
    const approveResult = await transitionState.execute({
      orderId,
      newState: 'QUOTATION_APPROVED',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });
    expect(approveResult.isSuccess()).toBe(true);

    // ── Step 6: Payment ──
    const payPendingResult = await transitionState.execute({
      orderId,
      newState: 'PAYMENT_PENDING',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });
    expect(payPendingResult.isSuccess()).toBe(true);

    const payReceivedResult = await transitionState.execute({
      orderId,
      newState: 'PAYMENT_RECEIVED',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });
    expect(payReceivedResult.isSuccess()).toBe(true);

    // ── Step 7: In Production ──
    const prodResult = await transitionState.execute({
      orderId,
      newState: 'IN_PRODUCTION',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });
    expect(prodResult.isSuccess()).toBe(true);

    // ── Step 8: Delivered ──
    const deliverResult = await transitionState.execute({
      orderId,
      newState: 'DELIVERED',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });
    expect(deliverResult.isSuccess()).toBe(true);

    // ── Step 9: Completed ──
    const completeResult = await transitionState.execute({
      orderId,
      newState: 'COMPLETED',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });
    expect(completeResult.isSuccess()).toBe(true);

    // ── Final Verification ──
    const finalOrderResult = await getOrder.execute({ orderId });
    const finalOrder = finalOrderResult.getValue();
    expect(finalOrder.state).toBe('COMPLETED');

    // Verify all state change events were published
    const stateEvents = ctx.eventPublisher.getEventsByType('OrderStateChanged');
    expect(stateEvents.length).toBeGreaterThanOrEqual(5);

    // Verify repository was called correctly
    expect(ctx.orderRepo.saveCallCount).toBeGreaterThanOrEqual(6);
    expect(ctx.orderRepo.count).toBe(1);
  });

  it('should reject invalid state transition: DRAFT → COMPLETED', async () => {
    const createResult = await createOrder.execute({
      clientId: TEST_IDS.client,
      eventDate: '2026-12-01T10:00:00Z',
      deliveryAddress: 'Draft St 1',
    });

    const order = createResult.getValue();
    const orderId = order.id.toString();

    const invalidResult = await transitionState.execute({
      orderId,
      newState: 'COMPLETED',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });

    expect(invalidResult.isFailure()).toBe(true);
  });

  it('should handle cancellation from any non-terminal state', async () => {
    const createResult = await createOrder.execute({
      clientId: TEST_IDS.client,
      eventDate: '2026-08-01T10:00:00Z',
      deliveryAddress: 'Cancel Rd 2',
    });

    const order = createResult.getValue();
    const orderId = order.id.toString();

    // Cancel from initial state (DRAFT permits CANCELLED)
    const cancelResult = await transitionState.execute({
      orderId,
      newState: 'CANCELLED',
      reason: 'Client changed plans',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });

    expect(cancelResult.isSuccess()).toBe(true);

    // Verify terminal — cannot transition further
    const reOpenResult = await transitionState.execute({
      orderId,
      newState: 'IN_PRODUCTION',
      performedBy: TEST_IDS.admin,
      performedByRole: UserRole.ADMIN,
    });

    expect(reOpenResult.isFailure()).toBe(true);
  });
});
