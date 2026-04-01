/**
 * Order Application Service — Hexagonal Entry Point
 *
 * Re-exports the order FSM from its current location in `lib/`
 * through the hexagonal-compliant path.
 *
 * @module core/application/services/order
 */

export {
    transitionOrder,
    canRefund,
    isValidTransition,
    getAvailableTransitions,
    getPublicStatus,
    calculateMarkup,
    calculateWithIVA,
} from '@/lib/order-fsm';

// New unified pricing engine (preferred for new code)
export {
    calculateMarkup as unifiedCalculateMarkup,
    applyIVA,
    formatCLP,
} from '@core/domain/pricing/PricingCalculator';
