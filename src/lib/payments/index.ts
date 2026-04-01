/**
 * Payment Barrel Exports — Organized by Responsibility
 *
 * @module lib/payments
 */

// Legacy re-export for backward compatibility
export { PaymentService } from './payment-service';

// Gateway factory
export { getGatewayService } from './gateway-factory';

// Domain port type
export type { PaymentPort } from '@app/ports/PaymentPort';
