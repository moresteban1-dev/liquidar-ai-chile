import { CreateOrderHandler } from '@core/application/handlers/order/CreateOrderUseCase'
import { AssignProviderToOrderHandler } from '@core/application/handlers/AssignProviderToOrderHandler'
import { AttachQuotationToOrderHandler } from '@core/application/handlers/AttachQuotationToOrderHandler'
import { InMemoryOrderRepository } from '@tests/mocks/InMemoryOrderRepository'
import { InMemoryQuotationRepository } from '@tests/mocks/InMemoryQuotationRepository'
import { InMemoryEventPublisher } from '@tests/mocks/InMemoryEventPublisher'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing'
import { Money } from '@core/domain/value-objects/Money'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'

/**
 * Business Flow Validation Tests
 * 
 * Valida flujos completos de negocio end-to-end
 * usando handlers reales pero con repositorios in-memory
 */

describe('Complete Order Cycle - Business Flows', () => {
  let createOrderHandler: CreateOrderHandler
  let assignProviderHandler: AssignProviderToOrderHandler
  let attachQuotationHandler: AttachQuotationToOrderHandler

  let orderRepository: InMemoryOrderRepository
  let quotationRepository: InMemoryQuotationRepository
  let eventPublisher: InMemoryEventPublisher

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository()
    quotationRepository = new InMemoryQuotationRepository()
    eventPublisher = new InMemoryEventPublisher()

    createOrderHandler = new CreateOrderHandler(orderRepository, eventPublisher)
    assignProviderHandler = new AssignProviderToOrderHandler(orderRepository)
    attachQuotationHandler = new AttachQuotationToOrderHandler(
      orderRepository,
      quotationRepository
    )
  })

  describe('Happy Path: Complete Order Lifecycle', () => {
    it('should execute complete business flow successfully', async () => {
      // ============================================
      // STEP 1: Cliente crea orden
      // ============================================

      const createOrderResult = await createOrderHandler.execute({
        clientId: 'business-client-001',
        eventDate: '2026-12-25T00:00:00.000Z',
        eventType: 'corporate',
        estimatedGuests: 200,
        deliveryAddress: 'Corporate HQ, Silicon Valley',
        specialInstructions: 'Premium setup required'
      })

      expect(createOrderResult.isSuccess()).toBe(true)
      const order = createOrderResult.unwrap()

      // ============================================
      // STEP 2: Admin transiciona a QUOTATION_PENDING
      // ============================================

      order.transition('QUOTATION_PENDING')
      await orderRepository.save(order)

      // ============================================
      // STEP 3: Admin asigna proveedor
      // ============================================

      const assignResult = await assignProviderHandler.execute({
        orderId: order.orderId.toString(),
        providerId: 'business-provider-001'
      })

      expect(assignResult.isSuccess()).toBe(true)

      // ============================================
      // STEP 4: Proveedor crea cotización (DRAFT)
      // ============================================

      const providerCost = Money.create(75000, 'USD').unwrap()
      const pricing = QuotationPricing.calculate(providerCost, {
        commissionRate: 0.25,
        platformFeeRate: 0,
        taxRate: 0,
      }).unwrap()

      const quotationResult = Quotation.create({
        orderId: order.orderId,
        providerId: new UniqueEntityID('business-provider-001'),
        status: 'DRAFT',
        pricing,
        serviceDescription: 'Premium corporate event package',
        includes: ['Service A'],
        excludes: ['Service B'],
        validUntil: new Date(),
        estimatedDeliveryDays: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const quotation = quotationResult.unwrap()
      await quotationRepository.save(quotation)

      // ============================================
      // STEP 5: Admin adjunta cotización a orden
      // ============================================

      const attachResult = await attachQuotationHandler.execute({
        orderId: order.orderId.toString(),
        quotationId: quotation.quotationId.toString(),
        providerCost: 75000,
        currency: 'USD',
        commissionRate: 0.25
      })

      expect(attachResult.isSuccess()).toBe(true)
      const finalOrder = attachResult.unwrap()
      expect(finalOrder.hasQuotation).toBe(true)
      expect(finalOrder.pricing?.finalPrice.amount).toBeGreaterThan(75000)
    })
  })
})
