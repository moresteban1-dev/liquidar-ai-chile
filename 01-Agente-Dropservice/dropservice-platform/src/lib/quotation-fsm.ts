import { QuotationInternalStatus, QuotationPublicStatus } from '@/lib/types';
import { DEFAULT_IVA_RATE } from '@core/domain/pricing/TaxConfig';
import { calculateMarkup } from '@core/domain/pricing/PricingCalculator';

/**
 * CONFIGURACIÓN DE LA MÁQUINA DE ESTADOS (FSM)
 * Definición estricta de transiciones permitidas.
 */

export const VALID_INTERNAL_TRANSITIONS: Record<QuotationInternalStatus, QuotationInternalStatus[]> = {
    // 1. Initial State
    DRAFT: ['PENDING_ASSIGNMENT'],

    // 2. Received -> Admin Assignments
    PENDING_ASSIGNMENT: ['PENDING_PROVIDER_BID', 'REJECTED', 'CANCELLED'],

    // 3. Admin Assigned -> Provider Quoting
    PENDING_PROVIDER_BID: ['PENDING_ADMIN_APPROVAL', 'PENDING_ASSIGNMENT', 'CANCELLED'],

    // 4. Provider Quoted -> Admin Reviews & Marks Up
    PENDING_ADMIN_APPROVAL: ['AWAITING_CLIENT_PAYMENT', 'PENDING_PROVIDER_BID', 'CANCELLED'],

    // 5. Sent to Client -> Waiting
    AWAITING_CLIENT_PAYMENT: ['APPROVED', 'REJECTED', 'CANCELLED'],

    // 6. Terminal / Post-Approval
    APPROVED: ['PAID', 'CANCELLED'],
    PAID: ['FULFILLED', 'CANCELLED'],
    FULFILLED: [],

    // Terminals
    REJECTED: [],
    CANCELLED: [],
};

/**
 * Mapeo de Estado Interno -> Estado Público (Lo que ve el cliente)
 */
export const INTERNAL_TO_PUBLIC_MAP: Record<QuotationInternalStatus, QuotationPublicStatus> = {
    DRAFT: 'RECIBIDA',
    PENDING_ASSIGNMENT: 'RECIBIDA',
    PENDING_PROVIDER_BID: 'EN_PROCESO',       // DB enum: EN_PROCESO (not EN_EVALUACION)
    PENDING_ADMIN_APPROVAL: 'EN_PROCESO',     // DB enum: EN_PROCESO
    AWAITING_CLIENT_PAYMENT: 'COTIZADA',
    APPROVED: 'APPROVED',
    PAID: 'APPROVED',
    FULFILLED: 'APPROVED',
    CANCELLED: 'REJECTED',
    REJECTED: 'REJECTED',
};

/**
 * Mapeo: status (inglés) → internal_status (enum legacy español en DB)
 * Idéntico a QuotationMapper.toPersistence() y al trigger SQL.
 */
export const INTERNAL_STATUS_MAP: Record<QuotationInternalStatus, string> = {
    DRAFT: 'PENDIENTE_ASIGNACION',
    PENDING_ASSIGNMENT: 'PENDIENTE_ASIGNACION',
    PENDING_PROVIDER_BID: 'PROVEEDOR_COTIZANDO',
    PENDING_ADMIN_APPROVAL: 'PROVEEDOR_COTIZANDO',
    AWAITING_CLIENT_PAYMENT: 'ESPERANDO_CLIENTE',
    APPROVED: 'ESPERANDO_CLIENTE',
    PAID: 'ESPERANDO_CLIENTE',
    FULFILLED: 'ESPERANDO_CLIENTE',
    CANCELLED: 'PENDIENTE_ASIGNACION',
    REJECTED: 'PENDIENTE_ASIGNACION',
};

/**
 * Construir objeto de actualización con los 3 campos de estado sincronizados.
 *
 * ⚠️ USAR SIEMPRE esta función en rutas API que cambien estado.
 * Con el trigger SQL activo, basta con cambiar `status`, pero esta
 * función garantiza consistencia incluso sin trigger (defensa en profundidad).
 *
 * @example
 * ```typescript
 * await supabase.from('quotations').update(
 *   buildStatusUpdate('PENDING_ADMIN_APPROVAL')
 * ).eq('id', id);
 *
 * // Con campos adicionales:
 * await supabase.from('quotations').update(
 *   buildStatusUpdate('PENDING_PROVIDER_BID', { assigned_provider_id: providerId })
 * ).eq('id', id);
 * ```
 */
export function buildStatusUpdate(
    newStatus: QuotationInternalStatus,
    additionalFields?: Record<string, unknown>
): Record<string, unknown> {
    return {
        status: newStatus,
        public_status: INTERNAL_TO_PUBLIC_MAP[newStatus],
        internal_status: INTERNAL_STATUS_MAP[newStatus],
        updated_at: new Date().toISOString(),
        ...additionalFields,
    };
}

/**
 * @deprecated Use `calculateMarkup()` from `@core/domain/pricing/PricingCalculator` directly.
 * Kept for backward compatibility with existing callers.
 */
export function calculatePricing(priceCost: number, markupPercentage: number) {
    // Delegates to the unified pricing engine
    const result = calculateMarkup(priceCost, markupPercentage);
    return {
        priceCost: result.priceCost,
        markupAmount: result.markupAmount,
        priceNet: result.priceNet,
        priceIva: result.priceIva,
        priceTotal: result.priceTotal,
    };
}

// ============================================
// MOTOR DE CÁLCULO V2 — Comisión Flexible
// ============================================

/** @deprecated Use DEFAULT_IVA_RATE from TaxConfig instead */
const IVA_RATE = DEFAULT_IVA_RATE;

export type CommissionMethod = 'MONTO_FIJO' | 'PORCENTAJE' | 'PORCENTAJE_CATEGORIA' | 'MIXTO';

export interface CommissionInput {
    method: CommissionMethod;
    subtotalServicesProvider: number;
    subtotalLogisticsProvider: number;
    /** Para MONTO_FIJO o MIXTO */
    fixedCommissionServices?: number;
    fixedCommissionLogistics?: number;
    /** Para PORCENTAJE (global) */
    globalPercentage?: number;
    /** Para PORCENTAJE_CATEGORIA */
    servicesPercentage?: number;
    logisticsPercentage?: number;
}

export interface CommissionResult {
    subtotalServicesProvider: number;
    subtotalLogisticsProvider: number;
    totalProviderNet: number;
    commissionServicesNet: number;
    commissionLogisticsNet: number;
    totalCommissionNet: number;
    totalNet: number;
    totalIva: number;
    totalWithIva: number;
}

/**
 * Calcula la comisión según el método elegido por el admin.
 * Todos los valores son NETO (sin IVA). IVA se calcula al final.
 */
export function calculateCommission(input: CommissionInput): CommissionResult {
    const { method, subtotalServicesProvider, subtotalLogisticsProvider } = input;
    const totalProviderNet = subtotalServicesProvider + subtotalLogisticsProvider;

    let commissionServicesNet = 0;
    let commissionLogisticsNet = 0;

    switch (method) {
        case 'MONTO_FIJO':
            commissionServicesNet = input.fixedCommissionServices ?? 0;
            commissionLogisticsNet = input.fixedCommissionLogistics ?? 0;
            break;

        case 'PORCENTAJE': {
            const pct = (input.globalPercentage ?? 0) / 100;
            commissionServicesNet = Math.round(subtotalServicesProvider * pct);
            commissionLogisticsNet = Math.round(subtotalLogisticsProvider * pct);
            break;
        }

        case 'PORCENTAJE_CATEGORIA': {
            const pctServ = (input.servicesPercentage ?? 0) / 100;
            const pctLog = (input.logisticsPercentage ?? 0) / 100;
            commissionServicesNet = Math.round(subtotalServicesProvider * pctServ);
            commissionLogisticsNet = Math.round(subtotalLogisticsProvider * pctLog);
            break;
        }

        case 'MIXTO':
            commissionServicesNet = input.fixedCommissionServices ?? 0;
            commissionLogisticsNet = input.fixedCommissionLogistics ?? 0;
            break;
    }

    const totalCommissionNet = commissionServicesNet + commissionLogisticsNet;
    const totalNet = totalProviderNet + totalCommissionNet;
    const totalIva = Math.round(totalNet * IVA_RATE);
    const totalWithIva = totalNet + totalIva;

    return {
        subtotalServicesProvider,
        subtotalLogisticsProvider,
        totalProviderNet,
        commissionServicesNet,
        commissionLogisticsNet,
        totalCommissionNet,
        totalNet,
        totalIva,
        totalWithIva,
    };
}

export function formatCLP(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Mapea una cotización a los datos iniciales que el formulario de proveedor espera.
 */
export function formatProviderBidData(quotation: any) {
    return {
        id: quotation.id,
        code: quotation.code,
        brief: quotation.brief,
        eventStartDate: quotation.eventStartDate,
        eventLocation: quotation.eventLocation,
        eventAddress: quotation.eventLocation, // mapping address to location if needed
        eventTime: quotation.eventTime,
        setupTime: quotation.setupTime,
        teardownTime: quotation.teardownTime,
        technicalVisit: quotation.providerSuggestsTechnicalVisit,
        requestedItems: quotation.service ? [{ itemName: quotation.service.name, quantity: 1 }] : [],
    };
}
