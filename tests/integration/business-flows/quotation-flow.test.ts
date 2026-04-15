import { createTestContainer, TestContainer } from '../../setup/test-container';
import { createTestOrder, TEST_IDS } from '../../setup/test-factories';
import { UniqueEntityID } from '@/core/shared/UniqueEntityID';
import { CreateQuotationHandler } from '@/core/application/handlers/CreateQuotationHandler';
import { ApproveQuotationHandler } from '@/core/application/handlers/ApproveQuotationHandler';
import { RejectQuotationHandler } from '@/core/application/handlers/RejectQuotationHandler';
import { CreateOrderHandler } from '@/core/application/handlers/CreateOrderHandler';
import { TransitionOrderStateHandler } from '@/core/application/handlers/TransitionOrderStateHandler';

describe('Quotation Flow — Full Integration', () => {
  let ctx: TestContainer;
  let createOrder: CreateOrderHandler;
  let createQuotation: CreateQuotationHandler;
  let approveQuotation: ApproveQuotationHandler;
  let rejectQuotation: RejectQuotationHandler;
  let transitionState: TransitionOrderStateHandler;

  beforeEach(() => {
    ctx = createTestContainer();

    // Seed an order
    const order = createTestOrder({
      state: 'QUOTATION_PENDING',
      providerId: TEST_IDS.provider,
    });
    ctx.orderRepo.seed([order]);

    createOrder = new CreateOrderHandler(ctx.orderRepo, ctx.eventPublisher);
    createQuotation = new CreateQuotationHandler(ctx.orderRepo, ctx.quotationRepo);
    approveQuotation = new ApproveQuotationHandler(ctx.quotationRepo, ctx.orderRepo, ctx.eventPublisher as any);
    rejectQuotation = new RejectQuotationHandler(ctx.quotationRepo, ctx.orderRepo, ctx.eventPublisher as any);
    transitionState = new TransitionOrderStateHandler(ctx.orderRepo, ctx.eventPublisher);
  });

  it('should create, approve quotation and transition order to approved', async () => {
    // Create quotation
    const createResult = await createQuotation.execute({
      commandName: 'CreateQuotation',
      orderId: TEST_IDS.order,
      providerId: TEST_IDS.provider,
      providerCost: 35000,
      currency: 'USD',
      commissionRate: 0.1,
      serviceDescription: 'Premium Package with Sound System',
      includes: ['DJ Set', 'Sound System'],
      excludes: [],
      validDays: 7,
      estimatedDeliveryDays: 3,
    });

    expect(createResult.isSuccess()).toBe(true);
    const createdQuotation = createResult.getValue();
    const quotationId = createdQuotation.id.toString();

    // Verify quotation created
    const foundQuotationResult = await ctx.quotationRepo.findById(new UniqueEntityID(quotationId));
    expect(foundQuotationResult.isSuccess()).toBe(true);
    const quotation = foundQuotationResult.getValue();
    expect(quotation).not.toBeNull();
    expect(quotation!.orderId.toString()).toBe(TEST_IDS.order);

    // Submit and send to client (required for approval)
    createdQuotation.submit();
    createdQuotation.sendToClient();
    await ctx.quotationRepo.save(createdQuotation);

    // Approve
    const approveResult = await approveQuotation.execute({
      commandName: 'ApproveQuotation',
      quotationId,
      clientId: TEST_IDS.client,
    });

    expect(approveResult.isSuccess()).toBe(true);

    // Verify events
    expect(ctx.eventPublisher.hasEvent('QuotationApproved')).toBe(true);
  });

  it('should reject quotation and allow re-quotation', async () => {
    // Create first quotation
    const q1Result = await createQuotation.execute({
      commandName: 'CreateQuotation',
      orderId: TEST_IDS.order,
      providerId: TEST_IDS.provider,
      providerCost: 50000,
      currency: 'USD',
      commissionRate: 0.1,
      serviceDescription: 'Basic Package',
      includes: ['Basic Setup'],
      excludes: [],
      validDays: 7,
      estimatedDeliveryDays: 3,
    });

    const q1 = q1Result.getValue();
    const q1Id = q1.id.toString();

    // Submit quotation to client first (required for rejection)
    q1.submit();
    q1.sendToClient();
    await ctx.quotationRepo.save(q1);

    // Reject
    const rejectResult = await rejectQuotation.execute({
      commandName: 'RejectQuotation',
      quotationId: q1Id,
      clientId: TEST_IDS.client,
      reason: 'Price too high for the scope',
    });

    expect(rejectResult.isSuccess()).toBe(true);
    expect(ctx.eventPublisher.hasEvent('QuotationRejected')).toBe(true);

    // Create revised quotation
    const q2Result = await createQuotation.execute({
      commandName: 'CreateQuotation',
      orderId: TEST_IDS.order,
      providerId: TEST_IDS.provider,
      providerCost: 35000,
      currency: 'USD',
      commissionRate: 0.1,
      serviceDescription: 'Adjusted Package',
      includes: ['Basic Setup'],
      excludes: [],
      validDays: 7,
      estimatedDeliveryDays: 3,
      providerNotes: 'Revised per feedback',
    });

    expect(q2Result.isSuccess()).toBe(true);

    // Should now have 2 quotations for same order
    const quotationsResult = await ctx.quotationRepo.findByOrder(new UniqueEntityID(TEST_IDS.order));
    const quotations = quotationsResult.getValue();
    expect(quotations.length).toBe(2);
  });
});
