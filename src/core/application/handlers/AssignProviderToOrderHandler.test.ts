import { describe, it, expect, beforeEach } from 'vitest'
import { AssignProviderToOrderHandler } from './AssignProviderToOrderHandler'
import { CreateOrderHandler } from './CreateOrderHandler'
import { InMemoryOrderRepository } from '@tests/mocks/InMemoryOrderRepository'
import { InMemoryEventPublisher } from '@tests/mocks/InMemoryEventPublisher'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'

describe('AssignProviderToOrderHandler', () => {
  let handler: AssignProviderToOrderHandler
  let createOrderHandler: CreateOrderHandler
  let orderRepository: InMemoryOrderRepository
  let eventPublisher: InMemoryEventPublisher

  beforeEach(() => {
    orderRepository = new InMemoryOrderRepository()
    eventPublisher = new InMemoryEventPublisher()
    handler = new AssignProviderToOrderHandler(orderRepository)
    createOrderHandler = new CreateOrderHandler(orderRepository, eventPublisher)
  })

  const createOrder = async () => {
    const result = await createOrderHandler.execute({
      clientId: 'client-123',
      eventDate: '2026-12-25T00:00:00.000Z',
      deliveryAddress: 'Test Address'
    })

    const order = result.unwrap()
    // Transicionar a QUOTATION_PENDING (necesario para asignar proveedor según reglas de negocio)
    order.transition('QUOTATION_PENDING')
    await orderRepository.save(order)

    return order
  }

  describe('Success Cases', () => {
    it('should assign provider to order', async () => {
      const order = await createOrder()

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        providerId: 'provider-456'
      })

      expect(result.isSuccess()).toBe(true)
      const updatedOrder = result.unwrap()
      expect(updatedOrder.providerId?.toString()).toBe('provider-456')
      expect(updatedOrder.hasProvider).toBe(true)
    })

    it('should persist provider assignment', async () => {
      const order = await createOrder()

      await handler.execute({
        orderId: order.orderId.toString(),
        providerId: 'provider-456'
      })

      const foundResult = await orderRepository.findById(order.orderId)
      expect(foundResult.unwrap()?.providerId?.toString()).toBe('provider-456')
    })
  })

  describe('Validation Failures', () => {
    it('should reject empty orderId', async () => {
      const result = await handler.execute({
        orderId: '',
        providerId: 'provider-456'
      })

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('Order ID')
    })

    it('should reject empty providerId', async () => {
      const result = await handler.execute({
        orderId: 'order-123',
        providerId: ''
      })

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('Provider ID')
    })

    it('should reject non-existent order', async () => {
      const result = await handler.execute({
        orderId: 'non-existent',
        providerId: 'provider-456'
      })

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('not found')
    })
  })

  describe('Business Rule Violations', () => {
    it('should reject assigning provider in wrong state', async () => {
      const orderResult = await createOrderHandler.execute({
        clientId: 'client-123',
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: 'Test Address'
      })

      const order = orderResult.unwrap() // DRAFT state

      const result = await handler.execute({
        orderId: order.orderId.toString(),
        providerId: 'provider-456'
      })

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('QUOTATION_PENDING')
    })

    it('should reject changing provider', async () => {
      const order = await createOrder()

      // Assign first provider
      await handler.execute({
        orderId: order.orderId.toString(),
        providerId: 'provider-1'
      })

      // Try to assign second provider
      const result = await handler.execute({
        orderId: order.orderId.toString(),
        providerId: 'provider-2'
      })

      expect(result.isFailure()).toBe(true)
      expect((result.getError() as any).message || result.getError()).toContain('already has')
    })
  })
})
