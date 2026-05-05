/**
 * NASA-Grade Engineering: Order Domain Entity
 */

import { OrderState } from '@/types/order';

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
  status: OrderState;
  priceTotal: number;
  items?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}
