/**
 * CreateOrderCommand
 * 
 * Command para crear una nueva orden
 */

export interface CreateOrderCommand {
  clientId: string
  eventDate: string              // ISO string
  eventType?: string              // 'wedding', 'corporate', etc.
  estimatedGuests?: number
  deliveryAddress: string
  specialInstructions?: string
}
