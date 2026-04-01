import { setupE2ETests, E2EHttpClient } from './setup'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'

describe('Order Workflow E2E', () => {
  const { getSupabaseClient } = setupE2ETests()
  const httpClient = new E2EHttpClient()

  describe('Complete Order Lifecycle', () => {
    it('should complete full order workflow from creation to quotation', async () => {
      // ============================================
      // STEP 1: Cliente crea orden
      // ============================================
      
      const createOrderResponse = await httpClient.post('/api/orders', {
        clientId: 'e2e-test-client-001',
        eventDate: '2026-12-25T00:00:00.000Z',
        eventType: 'wedding',
        estimatedGuests: 150,
        deliveryAddress: 'Av. Reforma 123, CDMX, México',
        specialInstructions: 'Vegetarian options required'
      })

      expect(createOrderResponse.status).toBe(201)
      expect(createOrderResponse.data).toHaveProperty('id')
      expect(createOrderResponse.data.state).toBe('DRAFT')

      const orderId = createOrderResponse.data.id
      console.log('✅ Order created:', orderId)

      // ============================================
      // STEP 2: Verificar orden en base de datos
      // ============================================

      const supabase = getSupabaseClient()
      const { data: orderInDb, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      expect(orderError).toBeNull()
      expect(orderInDb).toBeDefined()
      expect(orderInDb.state).toBe('DRAFT')
      expect(orderInDb.client_id).toBe('e2e-test-client-001')
      console.log('✅ Order verified in database')

      // ============================================
      // STEP 3: Verificar que se emitió OrderCreated event
      // ============================================

      const { data: events } = await supabase
        .from('domain_events')
        .select('*')
        .eq('aggregate_id', orderId)
        .eq('event_type', 'OrderCreated')

      expect(events).toBeDefined()
      expect(events!.length).toBeGreaterThan(0)
      console.log('✅ OrderCreated event published')

      // ============================================
      // STEP 4: Recuperar orden vía API
      // ============================================

      const getOrderResponse = await httpClient.get(`/api/orders/${orderId}`)

      expect(getOrderResponse.status).toBe(200)
      expect(getOrderResponse.data.id).toBe(orderId)
      expect(getOrderResponse.data.state).toBe('DRAFT')
      expect(getOrderResponse.data.isActive).toBe(true)
      expect(getOrderResponse.data.isPaid).toBe(false)
      console.log('✅ Order retrieved via API')

      // ============================================
      // STEP 5: Transicionar a QUOTATION_PENDING (directamente en DB para test)
      // ============================================

      await supabase
        .from('orders')
        .update({ state: 'QUOTATION_PENDING' })
        .eq('id', orderId)

      console.log('✅ Order transitioned to QUOTATION_PENDING')

      // ============================================
      // STEP 6: Admin asigna proveedor
      // ============================================

      const assignProviderResponse = await httpClient.post(
        `/api/orders/${orderId}/assign-provider`,
        {
          providerId: 'e2e-test-provider-001'
        }
      )

      expect(assignProviderResponse.status).toBe(200)
      expect(assignProviderResponse.data.providerId).toBe('e2e-test-provider-001')
      console.log('✅ Provider assigned to order')

      // ============================================
      // STEP 7: Verificar asignación en DB
      // ============================================

      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      expect(updatedOrder!.provider_id).toBe('e2e-test-provider-001')
      console.log('✅ Provider assignment verified')

      // ============================================
      // STEP 8: Crear cotización en DB
      // ============================================

      const quotationId = new UniqueEntityID('e2e-test-quotation-001').toString()

      const { error: quotationError } = await supabase
        .from('quotations')
        .insert({
          id: quotationId,
          order_id: orderId,
          provider_id: 'e2e-test-provider-001',
          status: 'DRAFT',
          service_description: 'Premium wedding catering for 150 guests',
          includes: ['Gourmet menu', 'Beverages', 'Staff', 'Table setup'],
          excludes: ['Decoration', 'Music'],
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_delivery_days: 3
        })

      expect(quotationError).toBeNull()
      console.log('✅ Quotation created in database')

      // ============================================
      // STEP 9: Crear pricing de cotización
      // ============================================

      const { error: pricingError } = await supabase
        .from('quotation_pricing')
        .insert({
          quotation_id: quotationId,
          provider_cost: 50000,
          admin_commission: 15000,
          platform_fee: 1950,
          taxes: 10712,
          final_price: 77662,
          currency: 'MXN'
        })

      expect(pricingError).toBeNull()
      console.log('✅ Quotation pricing created')

      // ============================================
      // STEP 10: Adjuntar cotización a orden (directo en DB por ahora)
      // ============================================

      await supabase
        .from('orders')
        .update({ quotation_id: quotationId })
        .eq('id', orderId)

      await supabase
        .from('order_pricing')
        .insert({
          order_id: orderId,
          provider_cost: 50000,
          admin_commission: 15000,
          platform_fee: 1950,
          taxes: 10712,
          final_price: 77662,
          currency: 'MXN'
        })

      console.log('✅ Quotation attached to order')

      // ============================================
      // STEP 11: Verificar orden completa con pricing
      // ============================================

      const getOrderWithPricingResponse = await httpClient.get(`/api/orders/${orderId}`)

      expect(getOrderWithPricingResponse.status).toBe(200)
      expect(getOrderWithPricingResponse.data.pricing).toBeDefined()
      expect(getOrderWithPricingResponse.data.pricing.finalPrice).toBe(77662)
      expect(getOrderWithPricingResponse.data.pricing.currency).toBe('MXN')
      console.log('✅ Order with pricing retrieved')

      // ============================================
      // RESULTADO FINAL
      // ============================================

      console.log('\n🎉 COMPLETE WORKFLOW TEST PASSED')
      console.log('Order ID:', orderId)
      console.log('State: QUOTATION_PENDING')
      console.log('Provider: e2e-test-provider-001')
      console.log('Final Price: MXN 77,662.00')
    }, 30000) // 30 second timeout for E2E test
  })

  describe('Error Scenarios', () => {
    it('should reject order with invalid data', async () => {
      const response = await httpClient.post('/api/orders', {
        clientId: 'invalid-uuid',
        eventDate: '2026-12-25',
        deliveryAddress: ''
      })

      expect(response.status).toBe(400)
      expect(response.data.error).toBeDefined()
    })

    it('should return 404 for non-existent order', async () => {
      const response = await httpClient.get('/api/orders/00000000-0000-0000-0000-000000000000')

      expect(response.status).toBe(404)
      expect(response.data.error).toContain('not found')
    })
  })
})
