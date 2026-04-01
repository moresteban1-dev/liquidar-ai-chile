import { CreateOrderHandler } from '@/core/application/handlers/order/CreateOrderUseCase'
import { TransitionOrderStateHandler } from '@/core/application/handlers/TransitionOrderStateHandler'
import { CreateQuotationHandler } from '@/core/application/handlers/CreateQuotationHandler'
import { DeleteOrderHandler } from '@/core/application/handlers/DeleteOrderHandler'
import { InMemoryOrderRepository } from '@/tests/mocks/InMemoryOrderRepository'
import { InMemoryQuotationRepository } from '@/tests/mocks/InMemoryQuotationRepository'
import { InMemoryEventPublisher } from '@/tests/mocks/InMemoryEventPublisher'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'

/**
 * RBAC E2E Validation Tests
 */

describe('RBAC E2E Validation', () => {
  let orderRepo: InMemoryOrderRepository
  let quotationRepo: InMemoryQuotationRepository
  let eventPublisher: InMemoryEventPublisher
  let createOrder: CreateOrderHandler
  let transitionState: TransitionOrderStateHandler
  let createQuotation: CreateQuotationHandler
  let deleteOrder: DeleteOrderHandler

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository()
    quotationRepo = new InMemoryQuotationRepository()
    eventPublisher = new InMemoryEventPublisher()
    createOrder = new CreateOrderHandler(orderRepo, eventPublisher)
    transitionState = new TransitionOrderStateHandler(orderRepo, eventPublisher)
    createQuotation = new CreateQuotationHandler(orderRepo, quotationRepo, eventPublisher)
    deleteOrder = new DeleteOrderHandler(orderRepo, eventPublisher)
  })

  const setupOrderInState = async (state: string) => {
    const result = await createOrder.execute({
      clientId: 'client-rbac-001',
      eventDate: '2026-12-25T00:00:00.000Z',
      deliveryAddress: 'RBAC Test'
    })
    const order = result.value
    if (state !== 'DRAFT') {
      order.transition(state as any)
      order.assignProvider(new UniqueEntityID('provider-rbac-001'))
    }
    await orderRepo.save(order)
    return order
  }

  describe('Client Permissions', () => {
    it('should allow client to cancel own order', async () => {
      const order = await setupOrderInState('DRAFT')
      const result = await transitionState.execute({
        orderId: order.orderId.toString(),
        newState: 'CANCELLED',
        performedBy: 'client-rbac-001',
        performedByRole: 'client'
      })
      expect(result.isSuccess()).toBe(true)
    })

    it('should DENY client from advancing to production', async () => {
      const order = await setupOrderInState('PAYMENT_RECEIVED')
      const result = await transitionState.execute({
        orderId: order.orderId.toString(),
        newState: 'IN_PRODUCTION',
        performedBy: 'client-rbac-001',
        performedByRole: 'client'
      })
      expect(result.isFailure()).toBe(true)
    })

    it('should allow client to delete own DRAFT order', async () => {
      const order = await setupOrderInState('DRAFT')
      const result = await deleteOrder.execute({
        orderId: order.orderId.toString(),
        performedBy: 'client-rbac-001',
        performedByRole: 'client'
      })
      expect(result.isSuccess()).toBe(true)
    })

    it('should DENY client from deleting non-DRAFT order', async () => {
      const order = await setupOrderInState('QUOTATION_PENDING')
      const result = await deleteOrder.execute({
        orderId: order.orderId.toString(),
        performedBy: 'client-rbac-001',
        performedByRole: 'client'
      })
      expect(result.isFailure()).toBe(true)
    })
  })

  describe('Provider Permissions', () => {
    it('should allow assigned provider to mark as delivered', async () => {
      const order = await setupOrderInState('IN_PRODUCTION')
      const result = await transitionState.execute({
        orderId: order.orderId.toString(),
        newState: 'DELIVERED',
        performedBy: 'provider-rbac-001',
        performedByRole: 'provider'
      })
      expect(result.isSuccess()).toBe(true)
    })

    it('should DENY unassigned provider from creating quotation', async () => {
      const order = await setupOrderInState('QUOTATION_PENDING')
      const result = await createQuotation.execute({
        orderId: order.orderId.toString(),
        providerId: 'wrong-provider',
        providerCost: 1000,
        currency: 'USD',
        commissionRate: 0.1,
        serviceDescription: 'Test',
        includes: [],
        excludes: [],
        validDays: 7,
        estimatedDeliveryDays: 1
      })
      expect(result.isFailure()).toBe(true)
    })
  })

  describe('Admin Permissions', () => {
    it('should allow admin to perform any transition', async () => {
      const order = await setupOrderInState('DRAFT')
      const result = await transitionState.execute({
        orderId: order.orderId.toString(),
        newState: 'QUOTATION_PENDING',
        performedBy: 'admin-1',
        performedByRole: 'admin'
      })
      expect(result.isSuccess()).toBe(true)
    })
  })
})
