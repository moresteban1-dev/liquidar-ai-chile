import { describe, it, expect, beforeEach } from 'vitest'
import { DeleteOrderHandler } from './DeleteOrderHandler'
import { CreateOrderHandler } from './order/CreateOrderUseCase'
import { InMemoryOrderRepository } from '@/tests/mocks/InMemoryOrderRepository'
import { InMemoryEventPublisher } from '@/tests/mocks/InMemoryEventPublisher'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { Money } from '@/core/domain/value-objects/Money'
import { QuotationPricing } from '@/core/domain/aggregates/order/QuotationPricing'

describe('DeleteOrderHandler', () => {
  let handler: DeleteOrderHandler
  let createHandler: CreateOrderHandler
  let orderRepository: InMemoryOrderRepository
  let eventPublisher: InMemoryEventPublisher

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository()
    eventPublisher = new InMemoryEventPublisher()
    handler = new DeleteOrderHandler(orderRepository, eventPublisher)
    createHandler = new CreateOrderHandler(orderRepository, eventPublisher)
  })

  const createOrder = async (state: string = 'DRAFT') => {
    const result = await createHandler.handle({
      clientId: 'client-123',
      serviceId: 'service-123',
      requirements: 'Requirements description',
      deadlineDays: 7,
      priceAmount: 10000
    })

    const order = result.value

    if (state === 'QUOTATION_PENDING') {
      order.transition('QUOTATION_PENDING')
    } else if (state === 'PAYMENT_RECEIVED') {
      order.transition('QUOTATION_PENDING')
      order.assignProvider(new UniqueEntityID('provider-456'))
      const cost = Money.create(10000, 'USD').unwrap()
      const pricing = QuotationPricing.calculate(cost, { 
        commissionRate: 0.30,
        platformFeeRate: 0.05,
        taxRate: 0.16 
      }).unwrap()
      order.attachQuotation(new UniqueEntityID('q-1'), pricing)
      order.transition('QUOTATION_SENT')
      order.approveQuotation()
      order.transition('PAYMENT_PENDING')
      order.confirmPayment()
    } else if (state === 'COMPLETED') {
      order.transition('QUOTATION_PENDING')
      order.assignProvider(new UniqueEntityID('provider-456'))
      const cost = Money.create(10000, 'USD').unwrap()
      const pricing = QuotationPricing.calculate(cost, { 
        commissionRate: 0.30,
        platformFeeRate: 0.05,
        taxRate: 0.16 
      }).unwrap()
      order.attachQuotation(new UniqueEntityID('q-1'), pricing)
      order.transition('QUOTATION_SENT')
      order.approveQuotation()
      order.transition('PAYMENT_PENDING')
      order.confirmPayment()
      order.startProduction()
      order.markAsDelivered()
      order.complete()
    } else if (state === 'IN_PRODUCTION') {
      order.transition('QUOTATION_PENDING')
      order.assignProvider(new UniqueEntityID('provider-456'))
      const cost = Money.create(10000, 'USD').unwrap()
      const pricing = QuotationPricing.calculate(cost, { 
        commissionRate: 0.30,
        platformFeeRate: 0.05,
        taxRate: 0.16 
      }).unwrap()
      order.attachQuotation(new UniqueEntityID('q-1'), pricing)
      order.transition('QUOTATION_SENT')
      order.approveQuotation()
      order.transition('PAYMENT_PENDING')
      order.confirmPayment()
      order.startProduction()
    }

    await orderRepository.save(order)
    return order
  }

  describe('Admin Delete', () => {
    it('should delete DRAFT order', async () => {
      const order = await createOrder('DRAFT')

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        performedBy: 'admin-001',
        performedByRole: 'admin'
      })

      expect(result.isSuccess()).toBe(true)

      const found = await orderRepository.findById(order.orderId)
      expect(found.value).toBeNull()
    })

    it('should delete QUOTATION_PENDING order (auto-cancel)', async () => {
      const order = await createOrder('QUOTATION_PENDING')

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        performedBy: 'admin-001',
        performedByRole: 'admin',
        reason: 'Admin cleanup'
      })

      expect(result.isSuccess()).toBe(true)
    })

    it('should reject deleting PAYMENT_RECEIVED order', async () => {
      const order = await createOrder('PAYMENT_RECEIVED')

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        performedBy: 'admin-001',
        performedByRole: 'admin'
      })

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('PAYMENT_RECEIVED')
    })

    it('should reject deleting IN_PRODUCTION order', async () => {
      const order = await createOrder('IN_PRODUCTION')

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        performedBy: 'admin-001',
        performedByRole: 'admin'
      })

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('IN_PRODUCTION')
    })

    it('should reject deleting COMPLETED order', async () => {
      const order = await createOrder('COMPLETED')

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        performedBy: 'admin-001',
        performedByRole: 'admin'
      })

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('COMPLETED')
    })

    it('should reject non-existent order', async () => {
      const result = await handler.execute({
        orderId: 'non-existent',
        performedBy: 'admin-001',
        performedByRole: 'admin'
      })

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('not found')
    })
  })

  describe('Client Delete', () => {
    it('should allow client to delete own DRAFT order', async () => {
      const order = await createOrder('DRAFT')

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        performedBy: 'client-123',
        performedByRole: 'client'
      })

      expect(result.isSuccess()).toBe(true)
    })

    it('should reject client deleting non-DRAFT order', async () => {
      const order = await createOrder('QUOTATION_PENDING')

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        performedBy: 'client-123',
        performedByRole: 'client'
      })

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('DRAFT')
    })

    it('should reject client deleting others order', async () => {
      const order = await createOrder('DRAFT')

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        performedBy: 'other-client-999',
        performedByRole: 'client'
      })

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('own orders')
    })
  })
})
