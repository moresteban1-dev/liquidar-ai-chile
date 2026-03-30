// vitest globals are enabled in vitest.config.ts
import { CreateQuotationHandler } from './CreateQuotationHandler';
import { SubmitQuotationHandler } from './SubmitQuotationHandler';
import { SendQuotationToClientHandler } from './SendQuotationToClientHandler';
import { ApproveQuotationHandler } from './ApproveQuotationHandler';
import { RejectQuotationHandler } from './RejectQuotationHandler';
import { CreateOrderHandler } from './order/CreateOrderUseCase';
import { InMemoryOrderRepository } from '@/tests/mocks/InMemoryOrderRepository';
import { InMemoryQuotationRepository } from '@/tests/mocks/InMemoryQuotationRepository';
import { InMemoryEventPublisher } from '@/tests/mocks/InMemoryEventPublisher';
import { UniqueEntityID } from '@/core/shared/UniqueEntityID';

describe('Quotation Workflow - Complete Lifecycle', () => {
  let createOrderHandler: CreateOrderHandler;
  let createQuotationHandler: CreateQuotationHandler;
  let submitQuotationHandler: SubmitQuotationHandler;
  let sendToClientHandler: SendQuotationToClientHandler;
  let approveHandler: ApproveQuotationHandler;
  let rejectHandler: RejectQuotationHandler;

  let orderRepository: InMemoryOrderRepository;
  let quotationRepository: InMemoryQuotationRepository;
  let eventPublisher: InMemoryEventPublisher;

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository();
    quotationRepository = new InMemoryQuotationRepository();
    eventPublisher = new InMemoryEventPublisher();

    createOrderHandler = new CreateOrderHandler(orderRepository, eventPublisher);

    createQuotationHandler = new CreateQuotationHandler(
      orderRepository, quotationRepository, eventPublisher
    );

    submitQuotationHandler = new SubmitQuotationHandler(
      quotationRepository, eventPublisher
    );

    sendToClientHandler = new SendQuotationToClientHandler(
      quotationRepository, orderRepository, eventPublisher
    );

    approveHandler = new ApproveQuotationHandler(
      quotationRepository, orderRepository, eventPublisher
    );

    rejectHandler = new RejectQuotationHandler(
      quotationRepository, orderRepository, eventPublisher
    );
  });

  const setupOrderWithProvider = async () => {
    const orderResult = await createOrderHandler.handle({
      clientId: 'client-123',
      serviceId: 'service-123',
      requirements: 'Manual order requirements',
      deadlineDays: 7,
      priceAmount: 100000,
      commandName: 'CreateOrderCommand'
    });

    if (orderResult.isFailure()) throw new Error(orderResult.error.message);
    const order = orderResult.unwrap();

    order.transition('QUOTATION_PENDING');
    order.assignProvider(new UniqueEntityID('provider-456'));
    await orderRepository.save(order);

    return order;
  };

  const createAndSubmitQuotation = async (orderId: string) => {
    // Create
    const createResult = await createQuotationHandler.handle({
      commandName: 'CreateQuotation',
      orderId,
      providerId: 'provider-456',
      providerCost: 50000,
      currency: 'MXN',
      commissionRate: 0.25,
      serviceDescription: 'Premium corporate catering',
      includes: ['Gourmet menu', 'Beverages', 'Staff'],
      excludes: ['Decoration'],
      validDays: 14,
      estimatedDeliveryDays: 3
    });

    if (createResult.isFailure()) throw new Error(createResult.error.message);
    const quotation = createResult.unwrap();

    // Submit
    await submitQuotationHandler.handle({
      commandName: 'SubmitQuotation',
      quotationId: quotation.quotationId.toString(),
      providerId: 'provider-456'
    });

    return quotation;
  };

  describe('Happy Path: Approval Flow', () => {
    it('should complete full approval workflow', async () => {
      // 1. Setup order with provider
      const order = await setupOrderWithProvider();

      // 2. Create and submit quotation
      const quotation = await createAndSubmitQuotation(order.orderId.toString());

      // 3. Admin sends to client
      const sendResult = await sendToClientHandler.handle({
        commandName: 'SendQuotationToClient',
        quotationId: quotation.quotationId.toString(),
        adminId: 'admin-001',
        adminNotes: 'Verified provider credentials, pricing looks fair'
      });

      expect(sendResult.isSuccess()).toBe(true);
      const sentQuo = sendResult.unwrap();
      expect(sentQuo.status).toBe('SENT_TO_CLIENT');

      // Verify order state changed
      const orderAfterSend = await orderRepository.findById(order.orderId);
      expect(orderAfterSend.unwrap()?.state).toBe('QUOTATION_SENT');

      // 4. Client approves
      const approveResult = await approveHandler.handle({
        commandName: 'ApproveQuotation',
        quotationId: quotation.quotationId.toString(),
        clientId: 'client-123',
        clientNotes: 'Great offer, looking forward to the event!'
      });

      expect(approveResult.isSuccess()).toBe(true);
      expect(approveResult.unwrap().status).toBe('APPROVED');

      // Verify order transitioned to PAYMENT_PENDING
      const orderAfterApprove = await orderRepository.findById(order.orderId);
      expect(orderAfterApprove.unwrap()?.state).toBe('PAYMENT_PENDING');
    });
  });

  describe('Happy Path: Rejection Flow', () => {
    it('should complete rejection workflow and allow re-quotation', async () => {
      // 1. Setup
      const order = await setupOrderWithProvider();

      // 2. First quotation
      const quotation1 = await createAndSubmitQuotation(order.orderId.toString());

      // 3. Admin sends to client
      await sendToClientHandler.handle({
        commandName: 'SendQuotationToClient',
        quotationId: quotation1.quotationId.toString(),
        adminId: 'admin-001'
      });

      // 4. Client rejects
      const rejectResult = await rejectHandler.handle({
        commandName: 'RejectQuotation',
        quotationId: quotation1.quotationId.toString(),
        clientId: 'client-123',
        reason: 'Price is too high for our budget, need at least 20% reduction'
      });

      expect(rejectResult.isSuccess()).toBe(true);
      expect(rejectResult.unwrap().status).toBe('REJECTED');

      // 5. Verify order went back to QUOTATION_PENDING
      const orderAfterReject = await orderRepository.findById(order.orderId);
      expect(orderAfterReject.unwrap()?.state).toBe('QUOTATION_PENDING');

      // 6. Provider creates new quotation with lower price
      const createResult2 = await createQuotationHandler.handle({
        commandName: 'CreateQuotation',
        orderId: order.orderId.toString(),
        providerId: 'provider-456',
        providerCost: 40000,
        currency: 'MXN',
        commissionRate: 0.20,
        serviceDescription: 'Adjusted corporate catering package',
        includes: ['Gourmet menu'],
        excludes: [],
        validDays: 7,
        estimatedDeliveryDays: 3
      });

      if (createResult2.isFailure()) throw new Error(createResult2.error.message);
      const quotation2 = createResult2.unwrap();
      
      await submitQuotationHandler.handle({
        commandName: 'SubmitQuotation',
        quotationId: quotation2.quotationId.toString(),
        providerId: 'provider-456'
      });

      await sendToClientHandler.handle({
        commandName: 'SendQuotationToClient',
        quotationId: quotation2.quotationId.toString(),
        adminId: 'admin-001'
      });

      // 7. Client approves new quotation
      const approveResult = await approveHandler.handle({
        commandName: 'ApproveQuotation',
        quotationId: quotation2.quotationId.toString(),
        clientId: 'client-123'
      });

      expect(approveResult.isSuccess()).toBe(true);
      expect(approveResult.unwrap().status).toBe('APPROVED');

      // 8. Verify order state
      const finalOrder = await orderRepository.findById(order.orderId);
      expect(finalOrder.unwrap()?.state).toBe('PAYMENT_PENDING');
    });
  });
});
