import { CreateOrderHandler } from '@/core/application/handlers/order/CreateOrderUseCase'
import { AssignProviderToOrderHandler } from '@/core/application/handlers/AssignProviderToOrderHandler'
import { TransitionOrderStateHandler } from '@/core/application/handlers/TransitionOrderStateHandler'
import { CreateQuotationHandler } from '@/core/application/handlers/CreateQuotationHandler'
import { SubmitQuotationHandler } from '@/core/application/handlers/SubmitQuotationHandler'
import { SendQuotationToClientHandler } from '@/core/application/handlers/SendQuotationToClientHandler'
import { ApproveQuotationHandler } from '@/core/application/handlers/ApproveQuotationHandler'
import { RejectQuotationHandler } from '@/core/application/handlers/RejectQuotationHandler'
import { ListOrdersByClientHandler } from '@/core/application/handlers/ListOrdersByClientHandler'
import { ListQuotationsByOrderHandler } from '@/core/application/handlers/ListQuotationsByOrderHandler'
import { GetOrderByIdHandler } from '@/core/application/handlers/GetOrderByIdHandler'
import { DeleteOrderHandler } from '@/core/application/handlers/DeleteOrderHandler'
import { AdminDashboardHandler } from '@/core/application/handlers/AdminDashboardHandler'
import { InMemoryOrderRepository } from '@/tests/mocks/InMemoryOrderRepository'
import { InMemoryQuotationRepository } from '@/tests/mocks/InMemoryQuotationRepository'
import { InMemoryEventPublisher } from '@/tests/mocks/InMemoryEventPublisher'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'

/**
 * Complete Business Flow E2E Tests
 */

describe('Complete Business Flow E2E', () => {
  let orderRepo: InMemoryOrderRepository
  let quotationRepo: InMemoryQuotationRepository
  let eventPublisher: InMemoryEventPublisher

  let createOrder: CreateOrderHandler
  let assignProvider: AssignProviderToOrderHandler
  let transitionState: TransitionOrderStateHandler
  let createQuotation: CreateQuotationHandler
  let submitQuotation: SubmitQuotationHandler
  let sendToClient: SendQuotationToClientHandler
  let approveQuotation: ApproveQuotationHandler
  let rejectQuotation: RejectQuotationHandler
  let listOrdersByClient: ListOrdersByClientHandler
  let listQuotationsByOrder: ListQuotationsByOrderHandler
  let getOrderById: GetOrderByIdHandler
  let deleteOrder: DeleteOrderHandler
  let adminDashboard: AdminDashboardHandler

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository()
    quotationRepo = new InMemoryQuotationRepository()
    eventPublisher = new InMemoryEventPublisher()

    createOrder = new CreateOrderHandler(orderRepo, eventPublisher)
    assignProvider = new AssignProviderToOrderHandler(orderRepo)
    transitionState = new TransitionOrderStateHandler(orderRepo, eventPublisher)
    createQuotation = new CreateQuotationHandler(orderRepo, quotationRepo, eventPublisher)
    submitQuotation = new SubmitQuotationHandler(quotationRepo, eventPublisher)
    sendToClient = new SendQuotationToClientHandler(quotationRepo, orderRepo, eventPublisher)
    approveQuotation = new ApproveQuotationHandler(quotationRepo, orderRepo, eventPublisher)
    rejectQuotation = new RejectQuotationHandler(quotationRepo, orderRepo, eventPublisher)
    listOrdersByClient = new ListOrdersByClientHandler(orderRepo)
    listQuotationsByOrder = new ListQuotationsByOrderHandler(quotationRepo)
    getOrderById = new GetOrderByIdHandler(orderRepo)
    deleteOrder = new DeleteOrderHandler(orderRepo, eventPublisher)
    adminDashboard = new AdminDashboardHandler(orderRepo)
  })

  describe('Flow 1: Happy Path - Order to Completion', () => {
    it('should execute complete order lifecycle', async () => {
      // 1. Client creates order
      const orderResult = await createOrder.execute({
        clientId: 'client-vip-001',
        eventDate: '2026-12-25T00:00:00.000Z',
        eventType: 'wedding',
        estimatedGuests: 200,
        deliveryAddress: 'Hacienda San Miguel, Cuernavaca, México',
        specialInstructions: 'Setup premium, opciones vegetarianas'
      })

      expect(orderResult.isSuccess()).toBe(true)
      const orderId = orderResult.value.orderId.toString()

      // 2. Admin transitions to QUOTATION_PENDING
      const toPendingResult = await transitionState.execute({
        orderId,
        newState: 'QUOTATION_PENDING',
        performedBy: 'admin-001',
        performedByRole: 'admin'
      })
      expect(toPendingResult.isSuccess()).toBe(true)

      // 3. Admin assigns provider
      const assignResult = await assignProvider.execute({
        orderId,
        providerId: 'provider-catering-001'
      })
      expect(assignResult.isSuccess()).toBe(true)

      // 4. Provider creates quotation
      const quotationResult = await createQuotation.execute({
        orderId,
        providerId: 'provider-catering-001',
        providerCost: 85000,
        currency: 'MXN',
        commissionRate: 0.25,
        serviceDescription: 'Servicio premium de catering para boda, 200 invitados',
        includes: ['Menú de 3 tiempos', 'Barra premium'],
        excludes: ['Flores'],
        validDays: 14,
        estimatedDeliveryDays: 1
      })
      expect(quotationResult.isSuccess()).toBe(true)
      const quotationId = quotationResult.value.quotationId.toString()

      // 5. Provider submits quotation
      const submitResult = await submitQuotation.execute({
        quotationId,
        providerId: 'provider-catering-001'
      })
      expect(submitResult.isSuccess()).toBe(true)

      // 6. Admin reviews and sends to client
      const sendResult = await sendToClient.execute({
        quotationId,
        adminId: 'admin-001'
      })
      expect(sendResult.isSuccess()).toBe(true)

      // 7. Client approves quotation
      const approveResult = await approveQuotation.execute({
        quotationId,
        clientId: 'client-vip-001'
      })
      expect(approveResult.isSuccess()).toBe(true)

      // 8. Admin confirms payment
      const paymentResult = await transitionState.execute({
        orderId,
        newState: 'PAYMENT_RECEIVED',
        performedBy: 'admin-001',
        performedByRole: 'admin'
      })
      expect(paymentResult.isSuccess()).toBe(true)

      // 9. Admin marks production
      const productionResult = await transitionState.execute({
        orderId,
        newState: 'IN_PRODUCTION',
        performedBy: 'admin-001',
        performedByRole: 'admin'
      })
      expect(productionResult.isSuccess()).toBe(true)

      // 10. Provider marks as delivered
      const deliverResult = await transitionState.execute({
        orderId,
        newState: 'DELIVERED',
        performedBy: 'provider-catering-001',
        performedByRole: 'provider'
      })
      expect(deliverResult.isSuccess()).toBe(true)

      // 11. Admin completes order
      const completeResult = await transitionState.execute({
        orderId,
        newState: 'COMPLETED',
        performedBy: 'admin-001',
        performedByRole: 'admin'
      })
      expect(completeResult.isSuccess()).toBe(true)

      // Final check
      const finalOrder = await getOrderById.execute({ orderId })
      expect(finalOrder.value.state).toBe('COMPLETED')
      expect(finalOrder.value.isActive).toBe(false)
    })
  })

  describe('Flow 2: Rejection → Re-quotation → Approval', () => {
    it('should handle rejection and re-quotation correctly', async () => {
      // Setup
      const orderResult = await createOrder.execute({
        clientId: 'client-budget-001',
        eventDate: '2026-08-15T00:00:00.000Z',
        deliveryAddress: 'Oficinas Corp'
      })
      const orderId = orderResult.value.orderId.toString()
      await transitionState.execute({ orderId, newState: 'QUOTATION_PENDING', performedBy: 'admin-001', performedByRole: 'admin' })
      await assignProvider.execute({ orderId, providerId: 'provider-events-002' })

      // Quote 1 (Too high)
      const q1Result = await createQuotation.execute({
        orderId, providerId: 'provider-events-002', providerCost: 100000, currency: 'MXN', commissionRate: 0.3,
        serviceDescription: 'Premium', includes: ['All'], excludes: [], validDays: 7, estimatedDeliveryDays: 2
      })
      const q1Id = q1Result.value.quotationId.toString()
      await submitQuotation.execute({ quotationId: q1Id, providerId: 'provider-events-002' })
      await sendToClient.execute({ quotationId: q1Id, adminId: 'admin-001' })

      // Client Rejects
      const rejectResult = await rejectQuotation.execute({
        quotationId: q1Id, clientId: 'client-budget-001', reason: 'Too expensive'
      })
      expect(rejectResult.isSuccess()).toBe(true)
      
      const orderAfterReject = await getOrderById.execute({ orderId })
      expect(orderAfterReject.value.state).toBe('QUOTATION_PENDING')

      // Quote 2 (Budget)
      const q2Result = await createQuotation.execute({
        orderId, providerId: 'provider-events-002', providerCost: 60000, currency: 'MXN', commissionRate: 0.2,
        serviceDescription: 'Budget', includes: ['Basic'], excludes: [], validDays: 7, estimatedDeliveryDays: 2
      })
      const q2Id = q2Result.value.quotationId.toString()
      await submitQuotation.execute({ quotationId: q2Id, providerId: 'provider-events-002' })
      await sendToClient.execute({ quotationId: q2Id, adminId: 'admin-001' })

      // Client Approves
      const approveResult = await approveQuotation.execute({
        quotationId: q2Id, clientId: 'client-budget-001'
      })
      expect(approveResult.isSuccess()).toBe(true)

      const finalOrder = await getOrderById.execute({ orderId })
      expect(finalOrder.value.state).toBe('PAYMENT_PENDING')
    })
  })

  describe('Flow 3: Multiple Orders + Dashboard', () => {
    it('should handle many orders and dashboard', async () => {
      // Create 5 orders
      for (let i = 0; i < 5; i++) {
        await createOrder.execute({
          clientId: 'client-frequent-001',
          eventDate: `2026-0${6+i}-15T00:00:00.000Z`,
          deliveryAddress: `Location ${i}`
        })
      }

      const listResult = await listOrdersByClient.execute({
        clientId: 'client-frequent-001'
      })
      expect(listResult.value.data).toHaveLength(5)

      const dashResult = await adminDashboard.execute()
      expect(dashResult.value.summary.totalOrders).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Flow 4: Delete Order Scenarios', () => {
    it('should handle soft deletion logic', async () => {
      const result = await createOrder.execute({
        clientId: 'client-del-001',
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: 'Delete Test'
      })
      const orderId = result.value.orderId.toString()

      // Client deletes own draft
      const delResult = await deleteOrder.execute({
        orderId,
        performedBy: 'client-del-001',
        performedByRole: 'client'
      })
      expect(delResult.isSuccess()).toBe(true)

      const found = await getOrderById.execute({ orderId })
      expect(found.isFailure()).toBe(true)
    })
  })
})
