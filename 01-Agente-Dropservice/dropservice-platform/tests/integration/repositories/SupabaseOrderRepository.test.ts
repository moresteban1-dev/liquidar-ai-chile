import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SupabaseOrderRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseOrderRepository'
import { OrderMapper } from '@/infrastructure/persistence/supabase/mappers/OrderMapper'
import { Order } from '@/core/domain/aggregates/order/Order'
import { QuotationPricing } from '@/core/domain/aggregates/order/QuotationPricing'
import { Money } from '@/core/domain/value-objects/Money'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'

/**
 * SupabaseOrderRepository Integration Tests
 * 
 * Verifica la persistencia real contra Supabase.
 * Nota: Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const HAS_SUPABASE = SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0 && SUPABASE_URL !== 'http://localhost'

describe.skipIf(!HAS_SUPABASE)('SupabaseOrderRepository Integration Tests', () => {
  let client: SupabaseClient
  let repository: SupabaseOrderRepository
  let mapper: OrderMapper

  beforeAll(() => {
    client = createClient(SUPABASE_URL, SUPABASE_KEY)
    mapper = new OrderMapper()
    repository = new SupabaseOrderRepository(client, mapper)
  })

  // Limpieza de datos de test
  const cleanup = async () => {
    await client.from('orders').delete().like('delivery_address', 'TEST_REPO_%')
  }

  beforeEach(async () => {
    await cleanup()
  })

  afterAll(async () => {
    await cleanup()
  })

  const createTestOrder = (idSuffix: string = '1') => {
    const eventDate = new Date()
    eventDate.setDate(eventDate.getDate() + 30)

    return Order.create({
      clientId: new UniqueEntityID('client-test-' + idSuffix),
      state: 'DRAFT',
      eventDate,
      deliveryAddress: 'TEST_REPO_Address_' + idSuffix,
      createdAt: new Date(),
      updatedAt: new Date()
    }).unwrap()
  }

  describe('save & findById', () => {
    it('should maintain data integrity through save and load cycle', async () => {
      const order = createTestOrder('integrity')
      const providerCost = Money.create(50000, 'USD').unwrap()
      const pricing = QuotationPricing.calculate(providerCost, {
        commissionRate: 0.20,
        platformFeeRate: 0,
        taxRate: 0,
      }).unwrap()

      order.transition('QUOTATION_PENDING')
      order.assignProvider(new UniqueEntityID('provider-test-integrity'))
      order.attachQuotation(new UniqueEntityID('quote-test-integrity'), pricing)

      const saveResult = await repository.save(order)
      expect(saveResult.isSuccess()).toBe(true)

      const findResult = await repository.findById(order.orderId)
      expect(findResult.isSuccess()).toBe(true)
      
      const loadedOrder = findResult.unwrap()!
      expect(loadedOrder).not.toBeNull()
      
      expect(loadedOrder.orderId.toString()).toBe(order.orderId.toString())
      expect(loadedOrder.state).toBe('QUOTATION_PENDING')
      expect(loadedOrder.deliveryAddress).toBe(order.deliveryAddress)
      
      expect(loadedOrder.pricing).toBeDefined()
      expect(loadedOrder.pricing?.providerCost.amount).toBe(50000)
      expect(loadedOrder.pricing?.finalPrice.amount).toBeGreaterThan(50000)
    })

    it('should update existing order correctly', async () => {
       const order = createTestOrder('update')
       await repository.save(order)

       order.transition('QUOTATION_PENDING')
       await repository.save(order)

       const loaded = (await repository.findById(order.orderId)).unwrap()!
       expect(loaded.state).toBe('QUOTATION_PENDING')
    })
  })

  describe('findActiveOrdersByClient', () => {
    it('should return only active orders for a specific client', async () => {
      const clientId = new UniqueEntityID('client-test-search')
      
      const activeOrder = createTestOrder('active')
      const activeWithClient = Order.create({
        ...activeOrder.props,
        clientId
      }, activeOrder.orderId).unwrap()

      const completedOrder = createTestOrder('completed')
      const completedWithClient = Order.create({
        ...completedOrder.props,
        clientId,
        state: 'COMPLETED'
      }, completedOrder.orderId).unwrap()

      await repository.save(activeWithClient)
      await repository.save(completedWithClient)

      const result = await repository.findActiveOrdersByClient(clientId)
      
      expect(result.isSuccess()).toBe(true)
      expect(result.unwrap().length).toBe(1)
      expect(result.unwrap()[0].orderId.toString()).toBe(activeOrder.orderId.toString())
    })
  })

  describe('delete', () => {
    it('should perform soft delete', async () => {
      const order = createTestOrder('delete')
      await repository.save(order)

      const deleteResult = await repository.delete(order.orderId)
      expect(deleteResult.isSuccess()).toBe(true)

      const findResult = await repository.findById(order.orderId)
      expect(findResult.unwrap()).toBeNull() // No debe encontrarlo por soft-delete filter
    })
  })
})
