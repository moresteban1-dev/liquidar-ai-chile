import { CreateOrderHandler } from '@core/application/handlers/order/CreateOrderUseCase'
import { TransitionOrderStateHandler } from '@core/application/handlers/TransitionOrderStateHandler'
import { InMemoryOrderRepository } from '../mocks/InMemoryOrderRepository'
import { InMemoryEventPublisher } from '../mocks/InMemoryEventPublisher'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { Money } from '@core/domain/value-objects/Money'
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing'

describe('Sprint 2 Regression Tests', () => {
  let orderRepo: InMemoryOrderRepository
  let eventPublisher: InMemoryEventPublisher

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository()
    eventPublisher = new InMemoryEventPublisher()
  })

  describe('Pricing Invariants', () => {
    it('should maintain pricing invariant through all transitions', async () => {
      const createResult = await new CreateOrderHandler(orderRepo, eventPublisher).execute({
        clientId: 'reg-client',
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: 'Reg'
      })

      expect(createResult.isSuccess()).toBe(true)
      const order = createResult.unwrap()
      
      order.transition('QUOTATION_PENDING')
      
      const cost = Money.create(10000, 'USD').unwrap()
      const pricing = QuotationPricing.calculate(cost, {
        commissionRate: 0.3,
        platformFeeRate: 0,
        taxRate: 0,
      }).unwrap()
      order.attachQuotation(new UniqueEntityID('quote-1'), pricing)

      // With 30% commission, no platform fee, no tax: 10000 + 3000 = 13000
      expect(order.pricing!.finalPrice.amount).toBe(13000)
      
      order.transition('QUOTATION_SENT')
      expect(order.pricing!.finalPrice.amount).toBe(13000)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle many concurrent order creations', async () => {
      const handler = new CreateOrderHandler(orderRepo, eventPublisher)
      const promises = Array.from({ length: 50 }, (_, i) => 
        handler.execute({
          clientId: `client-${i}`,
          eventDate: '2026-12-25T00:00:00.000Z',
          deliveryAddress: `Address ${i}`
        })
      )
      
      const results = await Promise.all(promises)
      expect(results.filter(r => r.isSuccess())).toHaveLength(50)
    })
  })

  describe('Boundary Values', () => {
    it('should handle zero commission rate', () => {
      const cost = Money.create(100, 'USD').unwrap()
      const pricing = QuotationPricing.calculate(cost, {
        commissionRate: 0,
        platformFeeRate: 0,
        taxRate: 0,
      }).unwrap()
      expect(pricing.finalPrice.amount).toBe(100)
    })

    it('should handle very long descriptions', async () => {
      const longDesc = 'A'.repeat(10000)
      const result = await new CreateOrderHandler(orderRepo, eventPublisher).execute({
        clientId: 'long-client',
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: 'Reg',
        specialInstructions: longDesc
      })

      expect(result.isSuccess()).toBe(true)
      // specialInstructions is a prop on Order — access through the order
      const order = result.unwrap()
      expect(order).toBeDefined()
    })
  })
})
