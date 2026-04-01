import { describe, it, expect } from 'vitest'
import {
  adaptCreateOrderRequest,
  adaptOrderResponse,
  isLegacyRequest,
  autoAdaptRequest,
  autoAdaptResponse
} from '@/infrastructure/migration/LegacyAdapter'

describe('V1 ↔ V2 Compatibility', () => {
  describe('Request Format Compatibility', () => {
    it('should handle v1 create order request', () => {
      const v1Request = {
        client_id: 'client-123',
        event_date: '2026-12-25T00:00:00.000Z',
        event_type: 'corporate',
        guests: 200,
        address: 'Av. Reforma 500, CDMX',
        notes: 'Premium setup'
      }

      const v2Request = autoAdaptRequest(v1Request)

      expect(v2Request.clientId).toBe('client-123')
      expect(v2Request.eventDate).toBe('2026-12-25T00:00:00.000Z')
      expect(v2Request.eventType).toBe('corporate')
      expect(v2Request.estimatedGuests).toBe(200)
      expect(v2Request.deliveryAddress).toBe('Av. Reforma 500, CDMX')
      expect(v2Request.specialInstructions).toBe('Premium setup')
    })

    it('should pass through v2 request unchanged', () => {
      const v2Request = {
        clientId: 'client-123',
        eventDate: '2026-12-25T00:00:00.000Z',
        eventType: 'corporate',
        estimatedGuests: 200,
        deliveryAddress: 'Av. Reforma 500, CDMX',
        specialInstructions: 'Premium setup'
      }

      const result = autoAdaptRequest(v2Request)

      expect(result).toEqual(v2Request)
    })
  })

  describe('Response Format Compatibility', () => {
    it('should adapt v2 response to v1 format for legacy clients', () => {
      const v2Response = {
        id: 'order-123',
        clientId: 'client-456',
        state: 'DRAFT',
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: 'Test Address',
        isActive: true,
        createdAt: '2026-03-19T00:00:00.000Z'
      }

      const v1Response = autoAdaptResponse(v2Response, true)

      expect('client_id' in v1Response).toBe(true)
      expect('status' in v1Response).toBe(true)
      expect('address' in v1Response).toBe(true)
      expect('active' in v1Response).toBe(true)
      expect('created_at' in v1Response).toBe(true)
    })

    it('should keep v2 format for v2 clients', () => {
      const v2Response = {
        id: 'order-123',
        clientId: 'client-456',
        state: 'DRAFT',
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: 'Test Address',
        isActive: true,
        createdAt: '2026-03-19T00:00:00.000Z'
      }

      const result = autoAdaptResponse(v2Response, false)

      expect('clientId' in result).toBe(true)
      expect('state' in result).toBe(true)
      expect('deliveryAddress' in result).toBe(true)
      expect('isActive' in result).toBe(true)
    })
  })

  describe('Round-trip Compatibility', () => {
    it('should maintain data through v1→v2→v1 conversion', () => {
      const originalV1 = {
        client_id: 'client-123',
        event_date: '2026-12-25T00:00:00.000Z',
        address: 'Test Address'
      }

      // v1 → v2
      const v2Request = adaptCreateOrderRequest(originalV1 as any)

      // Simulate v2 processing
      const v2Response = {
        id: 'new-order-id',
        clientId: v2Request.clientId,
        state: 'DRAFT',
        eventDate: v2Request.eventDate,
        deliveryAddress: v2Request.deliveryAddress,
        isActive: true,
        createdAt: new Date().toISOString()
      }

      // v2 → v1
      const v1Response = adaptOrderResponse(v2Response)

      // Verify data integrity
      expect(v1Response.client_id).toBe(originalV1.client_id)
      expect(v1Response.event_date).toBe(originalV1.event_date)
      expect(v1Response.address).toBe(originalV1.address)
    })
  })
})
