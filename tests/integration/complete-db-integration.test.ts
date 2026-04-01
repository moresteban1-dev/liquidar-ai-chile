import { SupabaseOrderRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseOrderRepository'
import { SupabaseQuotationRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseQuotationRepository'
import { OrderMapper } from '@/infrastructure/persistence/supabase/mappers/OrderMapper'
import { QuotationMapper } from '@/infrastructure/persistence/supabase/mappers/QuotationMapper'
import { Order } from '@/core/domain/aggregates/order/Order'
import { Quotation } from '@/core/domain/aggregates/quotation/Quotation'
import { QuotationPricing } from '@/core/domain/aggregates/order/QuotationPricing'
import { Money } from '@/core/domain/value-objects/Money'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const HAS_SUPABASE = SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0 && SUPABASE_URL !== 'http://localhost'

describe.skipIf(!HAS_SUPABASE)('Complete Database Integration', () => {
  let orderRepo: SupabaseOrderRepository
  let quotationRepo: SupabaseQuotationRepository
  const client = createClient(SUPABASE_URL || 'http://placeholder', SUPABASE_KEY || 'placeholder')

  beforeEach(() => {
    orderRepo = new SupabaseOrderRepository(client, new OrderMapper())
    quotationRepo = new SupabaseQuotationRepository(client, new QuotationMapper())
  })

  describe('Order CRUD Operations', () => {
    it('should create and retrieve order', async () => {
      const order = Order.create({
        clientId: new UniqueEntityID('db-client-1'),
        state: 'DRAFT',
        eventDate: new Date('2026-12-25'),
        deliveryAddress: 'DB Test Address',
        createdAt: new Date(),
        updatedAt: new Date()
      }, new UniqueEntityID('order-db-1')).unwrap()

      const saveResult = await orderRepo.save(order)
      expect(saveResult.isSuccess()).toBe(true)

      const findResult = await orderRepo.findById(order.orderId)
      expect(findResult.isSuccess()).toBe(true)
    })
  })

  describe('Quotation CRUD Operations', () => {
    it('should create and retrieve quotation', async () => {
      const cost = Money.create(5000, 'USD').unwrap()
      const pricing = QuotationPricing.calculate(cost, {
        commissionRate: 0.2,
        platformFeeRate: 0,
        taxRate: 0,
      }).unwrap()

      const quotation = Quotation.create({
        orderId: new UniqueEntityID('order-db-1'),
        providerId: new UniqueEntityID('provider-db-1'),
        status: 'DRAFT',
        pricing,
        serviceDescription: 'Test Service',
        includes: ['Service A'],
        excludes: ['Service B'],
        validUntil: new Date(),
        estimatedDeliveryDays: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }, new UniqueEntityID('quot-db-1')).unwrap()

      const saveResult = await quotationRepo.save(quotation)
      expect(saveResult.isSuccess()).toBe(true)
    })
  })
})
