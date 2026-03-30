/**
 * PricingCalculator — Unified Pricing Engine
 *
 * Consolidates the duplicated pricing calculation logic that was
 * previously scattered across `quotation-fsm.ts` and `order-fsm.ts`.
 *
 * Single Source of Truth for:
 * - Markup calculations (fixed or percentage)
 * - Commission calculations (V2 flexible model)
 * - IVA application
 * - Currency formatting
 *
 * @module core/domain/pricing/PricingCalculator
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DEFAULT_IVA_RATE as _DEFAULT_IVA_RATE, calculateIVA, calculateTotalWithIVA } from './TaxConfig';

// ─── Types ────────────────────────────────────────────────────

export interface MarkupResult {
    /** Original cost from provider */
    priceCost: number;
    /** Markup amount in CLP */
    markupAmount: number;
    /** Markup percentage applied */
    marginPercentage: number;
    /** Net price (cost + markup) */
    priceNet: number;
    /** IVA amount */
    priceIva: number;
    /** Total (net + IVA) */
    priceTotal: number;
}

export type CommissionMethod = 'MONTO_FIJO' | 'PORCENTAJE' | 'PORCENTAJE_CATEGORIA' | 'MIXTO';

export interface CommissionInput {
    method: CommissionMethod;
    subtotalServicesProvider: number;
    subtotalLogisticsProvider: number;
    /** For MONTO_FIJO or MIXTO */
    fixedCommissionServices?: number;
    fixedCommissionLogistics?: number;
    /** For PORCENTAJE (global) */
    globalPercentage?: number;
    /** For PORCENTAJE_CATEGORIA */
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

// ─── Core Functions ───────────────────────────────────────────

/**
 * Calculates the platform markup on a provider's cost.
 *
 * @param priceCost - Provider's cost in CLP (integer)
 * @param markupPercentage - Markup percentage (e.g., 30 = 30%)
 * @returns Complete pricing breakdown
 *
 * @example
 * ```typescript
 * const pricing = calculateMarkup(100000, 30);
 * // { priceCost: 100000, markupAmount: 30000, priceNet: 130000,
 * //   priceIva: 24700, priceTotal: 154700, marginPercentage: 30 }
 * ```
 */
export function calculateMarkup(priceCost: number, markupPercentage: number = 30): MarkupResult {
    const markupAmount = Math.round(priceCost * (markupPercentage / 100));
    const priceNet = priceCost + markupAmount;
    const priceIva = calculateIVA(priceNet);
    const priceTotal = priceNet + priceIva;

    return {
        priceCost,
        markupAmount,
        marginPercentage: markupPercentage,
        priceNet,
        priceIva,
        priceTotal,
    };
}

/**
 * Calculates the V2 flexible commission based on the admin's chosen method.
 * All values are NET (without IVA). IVA is calculated at the end.
 *
 * @param input - Commission configuration with amounts and method
 * @returns Complete commission breakdown
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
    const totalIva = calculateIVA(totalNet);
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

/**
 * Applies IVA to an amount.
 * @param amount - Net amount
 * @returns Total with IVA
 */
export function applyIVA(amount: number): number {
    return calculateTotalWithIVA(amount);
}

/**
 * Formats a CLP amount for display.
 *
 * @param amount - Amount in CLP (integer)
 * @returns Formatted string (e.g., "$1.234.567")
 */
export function formatCLP(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(amount);
}
