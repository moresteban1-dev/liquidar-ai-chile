/**
 * GetOrderByIdQuery
 */

export interface GetOrderByIdQuery {
  orderId: string
}

export interface GetOrderByIdResult {
  id: string
  clientId: string
  providerId?: string
  state: string
  eventDate: string
  deliveryAddress: string
  pricing?: {
    finalPrice: number
    currency: string
  }
  isActive: boolean
  isPaid: boolean
  createdAt: string
}
