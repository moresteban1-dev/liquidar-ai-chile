/**
 * NASA-Grade Engineering: Order Domain Entity
 */

export type OrderStatus = 
  | 'PAID'
  | 'IN_PRODUCTION'
  | 'INTERNAL_REVIEW'
  | 'DELIVERED'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'REFUNDED';

export interface OrderItem {
  id?: string;
  orderId: string;
  serviceId: string;
  quantity: number;
  priceUnit: number;
  priceTotal: number;
}

export interface Order {
  id: string;
  code: string;
  quotationId: string;
  clientId: string;
  providerId: string;
  status: OrderStatus;
  priceTotal: number;
  items?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}
