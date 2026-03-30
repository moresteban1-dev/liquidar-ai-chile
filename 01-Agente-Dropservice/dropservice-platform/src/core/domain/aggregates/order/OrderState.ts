/**
 * OrderState - Valid states for an Order aggregate.
 */
export type OrderState = 
  | 'DRAFT'
  | 'QUOTATION_PENDING'
  | 'QUOTATION_SENT'
  | 'QUOTATION_APPROVED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_RECEIVED'
  | 'IN_PRODUCTION'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';
