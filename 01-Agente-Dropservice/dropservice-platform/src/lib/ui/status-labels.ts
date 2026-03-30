import type { OrderStatusValue } from '../../core/domain/value-objects/OrderStatus';
import type { QuotationStatusValue } from '../../core/domain/value-objects/QuotationStatus';

/**
 * Labels en español para la UI.
 * Los valores internos son en inglés, pero la UI muestra español.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  DRAFT:           'Borrador',
  PENDING_PAYMENT: 'Pendiente de Pago',
  PAYMENT_FAILED:  'Pago Fallido',
  PAID:            'Pagada',
  ASSIGNED:        'Asignada',
  IN_PRODUCTION:   'En Producción',
  INTERNAL_REVIEW: 'Revisión Interna',
  UNDER_REVIEW:    'En Revisión (Cliente)',
  REVISION_REQUESTED: 'Con Observaciones',
  DELIVERED:       'Entregada',
  COMPLETED:       'Completada',
  CANCELLED:       'Cancelada',
  REFUNDED:        'Reembolsada',
  DISPUTED:        'En Disputa',
};

export const QUOTATION_STATUS_LABELS: Record<QuotationStatusValue, string> = {
  DRAFT:              'Borrador',
  PENDING_REVIEW:     'Pendiente de Revisión',
  AWAITING_PROVIDER:  'Esperando Proveedor',
  NEGOTIATING:        'En Negociación',
  APPROVED:           'Aprobada',
  REJECTED:           'Rechazada',
  SENT_TO_CLIENT:     'Enviada al Cliente',
  AWAITING_PAYMENT:   'Esperando Pago',
  PAID:               'Pagada',
  CANCELLED:          'Cancelada',
  COMPLETED:          'Completada',
};

export const ORDER_STATUS_COLORS: Record<OrderStatusValue, string> = {
  DRAFT:           'bg-gray-100 text-gray-800',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAYMENT_FAILED:  'bg-red-100 text-red-800',
  PAID:            'bg-blue-100 text-blue-800',
  ASSIGNED:        'bg-indigo-100 text-indigo-800',
  IN_PRODUCTION:   'bg-orange-100 text-orange-800',
  INTERNAL_REVIEW: 'bg-purple-100 text-purple-800',
  UNDER_REVIEW:    'bg-cyan-100 text-cyan-800',
  REVISION_REQUESTED: 'bg-amber-100 text-amber-800',
  DELIVERED:       'bg-teal-100 text-teal-800',
  COMPLETED:       'bg-green-100 text-green-800',
  CANCELLED:       'bg-red-100 text-red-800',
  REFUNDED:        'bg-pink-100 text-pink-800',
  DISPUTED:        'bg-red-100 text-red-800',
};

export const QUOTATION_STATUS_COLORS: Record<QuotationStatusValue, string> = {
  DRAFT:              'bg-gray-100 text-gray-800',
  PENDING_REVIEW:     'bg-yellow-100 text-yellow-800',
  AWAITING_PROVIDER:  'bg-orange-100 text-orange-800',
  NEGOTIATING:        'bg-blue-100 text-blue-800',
  APPROVED:           'bg-green-100 text-green-800',
  REJECTED:           'bg-red-100 text-red-800',
  SENT_TO_CLIENT:     'bg-indigo-100 text-indigo-800',
  AWAITING_PAYMENT:   'bg-amber-100 text-amber-800',
  PAID:               'bg-emerald-100 text-emerald-800',
  CANCELLED:          'bg-red-100 text-red-800',
  COMPLETED:          'bg-green-100 text-green-800',
};

/**
 * Componente helper para renderizar badges de status de Orden.
 */
export function getOrderStatusBadge(status: string): {
  label: string;
  className: string;
} {
  const s = status.toUpperCase() as OrderStatusValue;
  return {
    label: ORDER_STATUS_LABELS[s] ?? status,
    className: ORDER_STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-800',
  };
}

/**
 * Componente helper para renderizar badges de status de Cotización.
 */
export function getQuotationStatusBadge(status: string): {
  label: string;
  className: string;
} {
  const s = status.toUpperCase() as QuotationStatusValue;
  return {
    label: QUOTATION_STATUS_LABELS[s] ?? status,
    className: QUOTATION_STATUS_COLORS[s] ?? 'bg-gray-100 text-gray-800',
  };
}
