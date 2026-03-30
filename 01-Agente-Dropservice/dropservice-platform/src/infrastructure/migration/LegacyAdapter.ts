import { logger } from '@infrastructure/telemetry/StructuredLogger'

/**
 * LegacyAdapter
 * 
 * Adapta requests/responses entre el formato legacy (v1)
 * y el nuevo formato (v2)
 * 
 * Permite migración gradual sin romper clientes existentes
 */

// ============================================
// REQUEST ADAPTERS (v1 → v2)
// ============================================

export interface LegacyCreateOrderRequest {
  // v1 format (legacy)
  client_id: string
  event_date: string
  event_type?: string
  guests?: number
  address: string
  notes?: string
}

export interface V2CreateOrderRequest {
  // v2 format (new)
  clientId: string
  eventDate: string
  eventType?: string | null | undefined
  estimatedGuests?: number | null | undefined
  deliveryAddress: string
  specialInstructions?: string | null | undefined
}

export function adaptCreateOrderRequest(
  legacy: LegacyCreateOrderRequest
): V2CreateOrderRequest {
  return {
    clientId: legacy.client_id,
    eventDate: legacy.event_date,
    eventType: legacy.event_type,
    estimatedGuests: legacy.guests,
    deliveryAddress: legacy.address,
    specialInstructions: legacy.notes
  }
}

// ============================================
// RESPONSE ADAPTERS (v2 → v1)
// ============================================

export interface V2OrderResponse {
  id: string
  clientId: string
  state: string
  eventDate: string
  deliveryAddress: string
  isActive: boolean
  createdAt: string
}

export interface LegacyOrderResponse {
  // v1 format (legacy)
  id: string
  client_id: string
  status: string        // v1 usaba "status" en vez de "state"
  event_date: string
  address: string
  active: boolean
  created_at: string
}

export function adaptOrderResponse(
  v2Response: V2OrderResponse
): LegacyOrderResponse {
  return {
    id: v2Response.id,
    client_id: v2Response.clientId,
    status: v2Response.state,       // v1 = status, v2 = state
    event_date: v2Response.eventDate,
    address: v2Response.deliveryAddress,
    active: v2Response.isActive,
    created_at: v2Response.createdAt
  }
}

/**
 * Detecta si un request viene en formato v1 o v2
 */
export function isLegacyRequest(body: Record<string, unknown>): boolean {
  // v1 usa snake_case, v2 usa camelCase
  return 'client_id' in body || 'event_date' in body || 'address' in body
}

/**
 * Adapta automáticamente basado en el formato detectado
 */
export function autoAdaptRequest(
  body: Record<string, unknown>
): V2CreateOrderRequest {
  if (isLegacyRequest(body)) {
    logger.info('Legacy v1 request detected, adapting to v2')
    return adaptCreateOrderRequest(body as unknown as LegacyCreateOrderRequest)
  }

  return body as unknown as V2CreateOrderRequest
}

/**
 * Adapta respuesta basándose en el formato del request original
 */
export function autoAdaptResponse(
  v2Response: V2OrderResponse,
  wasLegacyRequest: boolean
): V2OrderResponse | LegacyOrderResponse {
  if (wasLegacyRequest) {
    logger.info('Adapting v2 response to legacy v1 format')
    return adaptOrderResponse(v2Response)
  }

  return v2Response
}
