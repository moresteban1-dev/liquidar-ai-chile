import { SupabaseOrderRepository } from '@infrastructure/persistence/supabase/repositories/SupabaseOrderRepository'
import { SupabaseQuotationRepository } from '@infrastructure/persistence/supabase/repositories/SupabaseQuotationRepository'
import { OrderMapper } from '@infrastructure/persistence/supabase/mappers/OrderMapper'
import { QuotationMapper } from '@infrastructure/persistence/supabase/mappers/QuotationMapper'
import { Order } from '@core/domain/aggregates/order/Order'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing'
import { Money } from '@core/domain/value-objects/Money'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { createClient } from '@supabase/supabase-js'

/**
 * Full Database Integration Tests
 * 
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Skips automatically if environment variables are not set.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const HAS_SUPABASE = SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0 && SUPABASE_URL !== 'http://localhost'

describe.skipIf(!HAS_SUPABASE)('Full Database Integration Tests', () => {
  let orderRepository: SupabaseOrderRepository
  let quotationRepository: SupabaseQuotationRepository

  beforeEach(() => {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY)
    orderRepository = new SupabaseOrderRepository(client, new OrderMapper())
    quotationRepository = new SupabaseQuotationRepository(client, new QuotationMapper())
  })

  describe('Order Repository - Complex Scenarios', () => {
    it('should save and retrieve order with complete pricing', async () => {
      const orderResult = Order.create({
        clientId: new UniqueEntityID('integration-client-001'),
        state: 'QUOTATION_PENDING',
        providerId: new UniqueEntityID('integration-provider-001'),
        eventDate: new Date('2026-12-25'),
        deliveryAddress: 'Integration Test Address',
        createdAt: new Date(),
        updatedAt: new Date()
      }, new UniqueEntityID('integration-order-001'))

      const order = orderResult.unwrap()

      const providerCost = Money.create(25000, 'USD').unwrap()
      const pricing = QuotationPricing.calculate(providerCost, {
        commissionRate: 0.35,
        platformFeeRate: 0.04,
        taxRate: 0.18
      }).unwrap()

      order.attachQuotation(new UniqueEntityID('integration-quotation-001'), pricing)

      const saveResult = await orderRepository.save(order)
      expect(saveResult.isSuccess()).toBe(true)

      const findResult = await orderRepository.findById(order.orderId)
      expect(findResult.isSuccess()).toBe(true)
      const retrieved = findResult.unwrap()
      expect(retrieved).not.toBeNull()

      expect(retrieved!.orderId.toString()).toBe(order.orderId.toString())
      expect(retrieved!.state).toBe('QUOTATION_PENDING')
      expect(retrieved!.pricing).toBeDefined()
      expect(retrieved!.pricing!.providerCost.amount).toBe(25000)
    })
  })

  describe('Quotation Repository - Complex Scenarios', () => {
    it('should save and retrieve quotation with pricing', async () => {
      const providerCost = Money.create(15000, 'USD').unwrap()
      const pricing = QuotationPricing.calculate(providerCost, {
        commissionRate: 0.30,
        platformFeeRate: 0,
        taxRate: 0,
      }).unwrap()

      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 14)

      const quotationResult = Quotation.create({
        orderId: new UniqueEntityID('integration-order-quote-001'),
        providerId: new UniqueEntityID('integration-provider-quote-001'),
        status: 'DRAFT',
        pricing,
        serviceDescription: 'Integration test quotation',
        includes: ['Service A', 'Service B'],
        excludes: ['Service C'],
        validUntil,
        estimatedDeliveryDays: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }, new UniqueEntityID('integration-quotation-quote-001'))

      const quotation = quotationResult.unwrap()

      const saveResult = await quotationRepository.save(quotation)
      expect(saveResult.isSuccess()).toBe(true)

      const findResult = await quotationRepository.findById(quotation.quotationId)
      expect(findResult.isSuccess()).toBe(true)
      const retrieved = findResult.unwrap()
      expect(retrieved).not.toBeNull()

      expect(retrieved!.status).toBe('DRAFT')
      expect(retrieved!.pricing.providerCost.amount).toBe(15000)
    })
  })
})
