/**
 * Quotation Application Service — Hexagonal Entry Point
 *
 * Re-exports the quotation FSM from its current location in `lib/`
 * through the hexagonal-compliant path.
 *
 * @module core/application/services/quotation
 */

export {
    VALID_INTERNAL_TRANSITIONS,
    INTERNAL_TO_PUBLIC_MAP,
    INTERNAL_STATUS_MAP,
    buildStatusUpdate,
    calculatePricing,
    calculateCommission,
    formatCLP,
} from '@/lib/quotation-fsm';

export type {
    CommissionMethod,
    CommissionInput,
    CommissionResult,
} from '@/lib/quotation-fsm';

// New unified pricing engine (preferred for new code)
export {
    calculateMarkup,
    calculateCommission as unifiedCalculateCommission,
    applyIVA,
    formatCLP as unifiedFormatCLP,
} from '@core/domain/pricing/PricingCalculator';
