import { describe, it, expect, beforeEach } from 'vitest'
import { AttachQuotationToOrderHandler } from './AttachQuotationToOrderHandler'
import { CreateOrderHandler } from './CreateOrderHandler'
import { InMemoryOrderRepository } from '@tests/mocks/InMemoryOrderRepository'
import { InMemoryQuotationRepository } from '@tests/mocks/InMemoryQuotationRepository'
import { InMemoryEventPublisher } from '@tests/mocks/InMemoryEventPublisher'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing'
import { Money } from '@core/domain/value-objects/Money'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'

describe('AttachQuotationToOrderHandler', () => {
  let handler: AttachQuotationToOrderHandler
  let createOrderHandler: CreateOrderHandler
  let orderRepository: InMemoryOrderRepository
  let quotationRepository: InMemoryQuotationRepository
  let eventPublisher: InMemoryEventPublisher

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository()
    quotationRepository = new InMemoryQuotationRepository()
    eventPublisher = new InMemoryEventPublisher()
    
    handler = new AttachQuotationToOrderHandler(orderRepository, quotationRepository)
    createOrderHandler = new CreateOrderHandler(orderRepository, eventPublisher)
  })

  const createOrderWithProvider = async () => {
    const orderResult = await createOrderHandler.execute({
      clientId: 'client-123',
      eventDate: '2026-12-25T00:00:00.000Z',
      deliveryAddress: 'Test Address'
    })

    const order = orderResult.unwrap()
    // Transicionar a QUOTATION_PENDING
    order.transition('QUOTATION_PENDING')
    order.assignProvider(new UniqueEntityID('provider-456'))
    await orderRepository.save(order)

    return order
  }

  const createQuotation = async (orderId: UniqueEntityID) => {
    const providerCost = Money.create(10000, 'USD').unwrap()
    const pricing = QuotationPricing.calculate(providerCost, {
      commissionRate: 0.30,
      platformFeeRate: 0,
      taxRate: 0
    }).unwrap()

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 7)

    const quotationResult = Quotation.create({
      orderId,
      providerId: new UniqueEntityID('provider-456'),
      status: 'DRAFT',
      pricing,
      serviceDescription: 'Wedding catering',
      includes: ['Food', 'Drinks'],
      excludes: ['Decoration'],
      validUntil,
      estimatedDeliveryDays: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const quotation = quotationResult.unwrap()
    await quotationRepository.save(quotation)

    return quotation
  }

  describe('Success Cases', () => {
    it('should attach quotation to order', async () => {
      const order = await createOrderWithProvider()
      const quotation = await createQuotation(order.orderId)

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        quotationId: quotation.quotationId.toString(),
        providerCost: 10000,
        currency: 'USD',
        commissionRate: 0.30
      })

      expect(result.isSuccess()).toBe(true)
      const updatedOrder = result.unwrap()
      expect(updatedOrder.hasQuotation).toBe(true)
      expect(updatedOrder.pricing).toBeDefined()
    })

    it('should calculate pricing correctly', async () => {
      const order = await createOrderWithProvider()
      const quotation = await createQuotation(order.orderId)

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        quotationId: quotation.quotationId.toString(),
        providerCost: 10000,
        currency: 'USD',
        commissionRate: 0.30
      })

      const updatedOrder = result.unwrap()
      expect(updatedOrder.pricing?.providerCost.amount).toBe(10000)
      expect(updatedOrder.pricing?.adminCommission.amount).toBe(3000)
    })
  })

  describe('Validation Failures', () => {
    it('should reject non-existent order', async () => {
      const result = await handler.execute({
        orderId: 'non-existent',
        quotationId: 'quotation-123',
        providerCost: 10000,
        currency: 'USD',
        commissionRate: 0.30
      })

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('not found')
    })

    it('should reject non-existent quotation', async () => {
      const order = await createOrderWithProvider()

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        quotationId: 'non-existent',
        providerCost: 10000,
        currency: 'USD',
        commissionRate: 0.30
      })

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('not found')
    })
  })
})
