import { Order, OrderEvent, OrderState } from '@/types/order';
import { AppError } from '@/core/shared/AppError';
import { Result, ok, fail } from '@/core/shared/Result';

// ============================================
// CONFIGURACIÓN DE TRANSICIONES
// ============================================

const TRANSITIONS: Record<OrderState, Partial<Record<OrderEvent['type'], OrderState>>> = {
    DRAFT: {
        SUBMIT: 'PENDING_PAYMENT'
    },
    PENDING_PAYMENT: {
        PAYMENT_CAPTURED: 'PAID', // Money in Escrow
        PAYMENT_FAILED: 'PAYMENT_FAILED'
    },
    PAYMENT_FAILED: {
        SUBMIT: 'PENDING_PAYMENT' // Retry
    },
    PAID: {
        ASSIGN_VENDOR: 'ASSIGNED',
        DISPUTE_OPENED: 'DISPUTED',
        CANCEL: 'CANCELLED'
    },
    ASSIGNED: {
        VENDOR_STARTED: 'IN_PRODUCTION',
        DISPUTE_OPENED: 'DISPUTED',
        CANCEL: 'CANCELLED'
    },
    IN_PRODUCTION: {
        DELIVERABLE_SUBMITTED: 'INTERNAL_REVIEW', // Vendor submits -> Admin checks
        DISPUTE_OPENED: 'DISPUTED'
    },
    INTERNAL_REVIEW: {
        ADMIN_APPROVED: 'UNDER_REVIEW', // Admin sends to client
        ADMIN_REJECTED: 'IN_PRODUCTION', // Back to vendor
        DISPUTE_OPENED: 'DISPUTED'
    },
    UNDER_REVIEW: {
        CLIENT_APPROVED: 'DELIVERED',
        CLIENT_REJECTED: 'REVISION_REQUESTED',
        DISPUTE_OPENED: 'DISPUTED'
    },
    REVISION_REQUESTED: {
        REVISION_COMPLETED: 'UNDER_REVIEW',
        DISPUTE_OPENED: 'DISPUTED'
    },
    DISPUTED: {
        DISPUTE_RESOLVED_CLIENT: 'REFUNDED',
        DISPUTE_RESOLVED_VENDOR: 'IN_PRODUCTION' // Resume work
    },
    DELIVERED: {
        FUNDS_RELEASED: 'COMPLETED',
        DISPUTE_OPENED: 'DISPUTED'
    },
    COMPLETED: {
        // TERMINAL
    },
    REFUNDED: {
        // TERMINAL
    },
    CANCELLED: {
        // TERMINAL
    }
};

// ============================================
// GUARD CONDITIONS (Reglas de Negocio)
// ============================================

function checkGuard(order: Order, event: OrderEvent): Result<void, AppError> {
    switch (event.type) {
        case 'PAYMENT_CAPTURED':
            // Check handled by Stripe usually, but ensures intent exists
            if (!event.paymentIntentId) {
                return fail(AppError.businessRule("FSM Violation: Cannot transition to Paid without PaymentIntentID"));
            }
            break;

        case 'CLIENT_APPROVED':
            // Must have deliverable URL to approve
            if (!('deliverableUrl' in order)) {
                return fail(AppError.businessRule("FSM Violation: Cannot approve order without deliverable"));
            }
            if (!event.signature) {
                return fail(AppError.businessRule("FSM Violation: Client digital signature required for completion"));
            }
            break;

        case 'DISPUTE_OPENED':
            if (['DELIVERED', 'REFUNDED', 'CANCELLED'].includes(order.state)) {
                return fail(AppError.businessRule(`FSM Violation: Cannot open dispute on terminal state ${order.state}`));
            }
            break;
    }
    return ok(undefined);
}


// ============================================
// CORE FSM FUNCTION
// ============================================

/**
 * Transita una orden al siguiente estado basándose en un evento.
 * Función Pura: No modifica la DB, solo retorna el nuevo estado.
 * 
 * @param currentOrder El objeto orden actual
 * @param event El evento que dispara la transición
 * @returns Result con el nuevo estado o AppError
 */
export function transitionOrder(currentOrder: Order, event: OrderEvent): Result<OrderState, AppError> {
    const currentState = currentOrder.state;
    const validTransitions = TRANSITIONS[currentState];

    if (!validTransitions) {
        return fail(AppError.businessRule(`FSM Error: No transitions defined for state '${currentState}'`));
    }

    const nextState = validTransitions[event.type];

    if (!nextState) {
        return fail(AppError.businessRule(`FSM Violation: Invalid transition from '${currentState}' via event '${event.type}'`));
    }

    // Ejecutar Guards
    const guardResult = checkGuard(currentOrder, event);
    if (guardResult.isFailure()) {
        return fail(guardResult.getError());
    }

    return ok(nextState);
}

// ============================================
// UTILITIES
// ============================================

export function canRefund(order: Order): boolean {
    // Solo se puede reembolsar si está en disputa y la resolución es a favor del cliente
    // O si está en escrow y no se ha asignado vendor (política de cancelación)
    if (order.state === 'DISPUTED') return true;
    if (order.state === 'PAID') return true; // In Escrow
    return false;
}

export function isValidTransition(currentState: OrderState, nextState: OrderState): boolean {
    const validNextStates = TRANSITIONS[currentState];
    if (!validNextStates) return false;
    return Object.values(validNextStates).includes(nextState);
}

export function getAvailableTransitions(currentState: OrderState): OrderState[] {
    const validNextStates = TRANSITIONS[currentState];
    if (!validNextStates) return [];
    return Object.values(validNextStates);
}

export function getPublicStatus(state: OrderState): string {
    const map: Record<OrderState, string> = {
        DRAFT: 'Borrador',
        PENDING_PAYMENT: 'Pendiente de Pago',
        PAYMENT_FAILED: 'Pago Fallido',
        PAID: 'En Escrow / Pagada',
        ASSIGNED: 'Asignada',
        IN_PRODUCTION: 'En Producción',
        INTERNAL_REVIEW: 'Revisión de Calidad (Interna)',
        UNDER_REVIEW: 'En Revisión (Entregable Listo)',
        REVISION_REQUESTED: 'Con Observaciones',
        DISPUTED: 'En Disputa',
        DELIVERED: 'Entregada por Vendor',
        COMPLETED: 'Orden Completada (Fondos Liberados)',
        REFUNDED: 'Reembolsada',
        CANCELLED: 'Cancelada'
    };
    return map[state] || state;
}

/**
 * @deprecated Use `calculateMarkup()` from `@core/domain/pricing/PricingCalculator` directly.
 */
export function calculateMarkup(priceCost: number, markupPercentage: number = 30) {
     
    const { calculateMarkup: unifiedCalc } = require('@core/domain/pricing/PricingCalculator');
    return unifiedCalc(priceCost, markupPercentage);
}

/**
 * @deprecated Use `applyIVA()` from `@core/domain/pricing/PricingCalculator` directly.
 */
export function calculateWithIVA(amount: number): number {
     
    const { applyIVA } = require('@core/domain/pricing/PricingCalculator');
    return applyIVA(amount);
}
