import { describe, it, expect } from 'vitest'
import {
  adaptCreateOrderRequest,
  adaptOrderResponse,
  isLegacyRequest,
  autoAdaptRequest,
  autoAdaptResponse
} from './LegacyAdapter'

describe('LegacyAdapter', () => {
  describe('Request Adaptation (v1 → v2)', () => {
    it('should adapt legacy create order request', () => {
      const legacy = {
        client_id: 'client-123',
        event_date: '2026-12-25T00:00:00.000Z',
        event_type: 'wedding',
        guests: 150,
        address: 'Av. Reforma 123',
        notes: 'Vegetarian options'
      }

      const v2 = adaptCreateOrderRequest(legacy)

      expect(v2.clientId).toBe('client-123')
      expect(v2.eventDate).toBe('2026-12-25T00:00:00.000Z')
      expect(v2.eventType).toBe('wedding')
      expect(v2.estimatedGuests).toBe(150)
      expect(v2.deliveryAddress).toBe('Av. Reforma 123')
      expect(v2.specialInstructions).toBe('Vegetarian options')
    })

    it('should handle missing optional fields', () => {
      const legacy = {
        client_id: 'client-123',
        event_date: '2026-12-25T00:00:00.000Z',
        address: 'Test Address'
      }

      const v2 = adaptCreateOrderRequest(legacy)

      expect(v2.eventType).toBeUndefined()
      expect(v2.estimatedGuests).toBeUndefined()
      expect(v2.specialInstructions).toBeUndefined()
    })
  })

  describe('Response Adaptation (v2 → v1)', () => {
    it('should adapt v2 response to legacy format', () => {
      const v2Response = {
        id: 'order-123',
        clientId: 'client-456',
        state: 'DRAFT',
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: 'Test Address',
        isActive: true,
        createdAt: '2026-03-19T00:00:00.000Z'
      }

      const legacy = adaptOrderResponse(v2Response)

      expect(legacy.client_id).toBe('client-456')
      expect(legacy.status).toBe('DRAFT')     // state → status
      expect(legacy.address).toBe('Test Address')
      expect(legacy.active).toBe(true)
      expect(legacy.created_at).toBe('2026-03-19T00:00:00.000Z')
    })
  })

  describe('Format Detection', () => {
    it('should detect legacy v1 format', () => {
      expect(isLegacyRequest({ client_id: '123', event_date: '2026-01-01' })).toBe(true)
      expect(isLegacyRequest({ address: 'test' })).toBe(true)
    })

    it('should detect v2 format', () => {
      expect(isLegacyRequest({ clientId: '123', eventDate: '2026-01-01' })).toBe(false)
      expect(isLegacyRequest({ deliveryAddress: 'test' })).toBe(false)
    })
  })

  describe('Auto Adaptation', () => {
    it('should auto-adapt legacy request', () => {
      const body = {
        client_id: 'client-123',
        event_date: '2026-12-25T00:00:00.000Z',
        address: 'Test'
      }

      const result = autoAdaptRequest(body)

      expect(result.clientId).toBe('client-123')
      expect(result.eventDate).toBe('2026-12-25T00:00:00.000Z')
      expect(result.deliveryAddress).toBe('Test')
    })

    it('should pass through v2 request', () => {
      const body = {
        clientId: 'client-123',
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: 'Test'
      }

      const result = autoAdaptRequest(body)

      expect(result.clientId).toBe('client-123')
    })

    it('should auto-adapt response for legacy clients', () => {
      const v2Response = {
        id: 'order-123',
        clientId: 'client-456',
        state: 'DRAFT',
        eventDate: '2026-12-25T00:00:00.000Z',
        deliveryAddress: 'Test',
        isActive: true,
        createdAt: '2026-03-19T00:00:00.000Z'
      }

      const legacyResult = autoAdaptResponse(v2Response, true)
      expect('client_id' in legacyResult).toBe(true)
      expect('status' in legacyResult).toBe(true)

      const v2Result = autoAdaptResponse(v2Response, false)
      expect('clientId' in v2Result).toBe(true)
      expect('state' in v2Result).toBe(true)
    })
  })
})
