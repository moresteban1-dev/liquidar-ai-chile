import { describe, it, expect } from 'vitest'
import { Order } from './Order'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { Money } from '@/core/domain/value-objects/Money'
import { QuotationPricing } from './QuotationPricing'

describe('Order Aggregate', () => {
  // Helper para crear orden válida
  const createValidOrderProps = () => ({
    clientId: new UniqueEntityID('client-123'),
    state: 'DRAFT' as const,
    eventDate: new Date('2026-12-25'),
    deliveryAddress: 'Av. Reforma 123, CDMX',
    createdAt: new Date('2026-03-19'),
    updatedAt: new Date('2026-03-19')
  })

  describe('Creation', () => {
    it('should create valid order', () => {
      const result = Order.create(createValidOrderProps())

      expect(result.isSuccess()).toBe(true)
      expect(result.value.state).toBe('DRAFT')
      expect(result.value.isActive).toBe(true)
    })

    it('should emit OrderCreated event on creation', () => {
      const result = Order.create(createValidOrderProps())
      const order = result.value

      const events = order.domainEvents
      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe('OrderCreated')
    })

    it('should reject past event date', () => {
      const props = {
        ...createValidOrderProps(),
        eventDate: new Date('2020-01-01')
      }

      const result = Order.create(props)

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('past')
    })

    it('should reject empty delivery address', () => {
      const props = {
        ...createValidOrderProps(),
        deliveryAddress: '   '
      }

      const result = Order.create(props)

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('empty')
    })

    it('should accept today as event date', () => {
      const today = new Date()
      const props = {
        ...createValidOrderProps(),
        eventDate: today
      }

      const result = Order.create(props)

      expect(result.isSuccess()).toBe(true)
    })

    it('should accept future event date', () => {
      const future = new Date()
      future.setDate(future.getDate() + 30)

      const props = {
        ...createValidOrderProps(),
        eventDate: future
      }

      const result = Order.create(props)

      expect(result.isSuccess()).toBe(true)
    })

    it('should not emit event when reconstructing from persistence', () => {
      const id = new UniqueEntityID('existing-order-id')
      const result = Order.create(createValidOrderProps(), id)
      const order = result.value

      expect(order.domainEvents).toHaveLength(0)
    })
  })

  describe('State Transitions - Valid', () => {
    it('should transition from DRAFT to QUOTATION_PENDING', () => {
      const order = Order.create(createValidOrderProps()).value
      
      const result = order.transition('QUOTATION_PENDING')

      expect(result.isSuccess()).toBe(true)
      expect(order.state).toBe('QUOTATION_PENDING')
    })

    it('should transition from QUOTATION_PENDING to QUOTATION_SENT', () => {
      const order = Order.create({
        ...createValidOrderProps(),
        state: 'QUOTATION_PENDING'
      }).value

      const result = order.transition('QUOTATION_SENT')

      expect(result.isSuccess()).toBe(true)
      expect(order.state).toBe('QUOTATION_SENT')
    })

    it('should emit OrderStateChanged event on transition', () => {
      const order = Order.create(createValidOrderProps()).value
      order.clearEvents() // Limpiar evento de creación

      order.transition('QUOTATION_PENDING')

      const events = order.domainEvents
      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe('OrderStateChanged')
      
      const event = events[0] as any
      expect(event.fromState).toBe('DRAFT')
      expect(event.toState).toBe('QUOTATION_PENDING')
    })
  })

  describe('State Transitions - Invalid', () => {
    it('should reject invalid transition from DRAFT to COMPLETED', () => {
      const order = Order.create(createValidOrderProps()).value

      const result = order.transition('COMPLETED')

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('Invalid')
      expect(order.state).toBe('DRAFT') // Estado no cambió
    })

    it('should reject transition from COMPLETED to anything', () => {
      const order = Order.create({
        ...createValidOrderProps(),
        state: 'COMPLETED'
      }).value

      const result = order.transition('CANCELLED')

      expect(result.isFailure()).toBe(true)
    })
  })

  describe('Assign Provider', () => {
    it('should assign provider in QUOTATION_PENDING state', () => {
      const order = Order.create({
        ...createValidOrderProps(),
        state: 'QUOTATION_PENDING'
      }).value

      const providerId = new UniqueEntityID('provider-456')
      const result = order.assignProvider(providerId)

      expect(result.isSuccess()).toBe(true)
      expect(order.providerId?.toString()).toBe('provider-456')
    })

    it('should reject assigning provider in wrong state', () => {
      const order = Order.create(createValidOrderProps()).value // DRAFT

      const providerId = new UniqueEntityID('provider-456')
      const result = order.assignProvider(providerId)

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('QUOTATION_PENDING')
    })
  })

  describe('Attach Quotation', () => {
    it('should attach quotation with valid pricing', () => {
      const order = Order.create({
        ...createValidOrderProps(),
        state: 'QUOTATION_PENDING',
        providerId: new UniqueEntityID('provider-456')
      }).value

      const providerCost = Money.create(10000, 'USD').value
      const pricingRes = QuotationPricing.calculate(providerCost, 0.30)
      const pricing = pricingRes.value

      const quotationId = new UniqueEntityID('quotation-789')
      const result = order.attachQuotation(quotationId, pricing)

      expect(result.isSuccess()).toBe(true)
      expect(order.quotationId?.toString()).toBe('quotation-789')
      expect(order.pricing).toBeDefined()
    })
  })

  describe('Cancellation', () => {
    it('should cancel order with reason', () => {
      const order = Order.create({
        ...createValidOrderProps(),
        state: 'QUOTATION_SENT'
      }).value

      const result = order.cancel('Client requested cancellation')

      expect(result.isSuccess()).toBe(true)
      expect(order.state).toBe('CANCELLED')
      expect(order.cancelledAt).toBeDefined()
      expect(order.cancellationReason).toBe('Client requested cancellation')
    })

    it('should reject cancellation without reason', () => {
      const order = Order.create(createValidOrderProps()).value

      const result = order.cancel('')

      expect(result.isFailure()).toBe(true)
      expect(result.error).toContain('reason')
    })
  })

  describe('Complete Workflow E2E', () => {
    it('should complete full order lifecycle', () => {
      // 1. Create order
      const order = Order.create(createValidOrderProps()).value
      expect(order.state).toBe('DRAFT')

      // 2. Move to quotation pending
      order.transition('QUOTATION_PENDING')
      expect(order.state).toBe('QUOTATION_PENDING')

      // 3. Assign provider
      const providerId = new UniqueEntityID('provider-123')
      order.assignProvider(providerId)
      expect(order.hasProvider).toBe(true)

      // 4. Attach quotation
      const providerCost = Money.create(10000, 'USD').value
      const pricing = QuotationPricing.calculate(providerCost, 0.30).value
      const quotationId = new UniqueEntityID('quotation-456')
      
      order.attachQuotation(quotationId, pricing)
      expect(order.hasQuotation).toBe(true)

      // 5. Send quotation
      order.transition('QUOTATION_SENT')
      expect(order.state).toBe('QUOTATION_SENT')

      // 6. Approve quotation
      order.approveQuotation()
      expect(order.state).toBe('QUOTATION_APPROVED')

      // 7. Request payment
      order.transition('PAYMENT_PENDING')
      expect(order.state).toBe('PAYMENT_PENDING')

      // 8. Confirm payment
      order.confirmPayment()
      expect(order.state).toBe('PAYMENT_RECEIVED')
      expect(order.isPaid).toBe(true)

      // 9. Start production
      order.startProduction()
      expect(order.state).toBe('IN_PRODUCTION')

      // 10. Deliver
      order.markAsDelivered()
      expect(order.state).toBe('DELIVERED')

      // 11. Complete
      order.complete()
      expect(order.state).toBe('COMPLETED')
      expect(order.isActive).toBe(false)
      expect(order.completedAt).toBeDefined()
    })
  })
})
