/**
 * Shared Formatting Utilities
 *
 * Core-level pure utility functions for data presentation.
 * Accessible by all layers (domain, application, infrastructure, presentation).
 */

/**
 * Format a number as Chilean Pesos (CLP).
 *
 * @param amount - Numeric value, null or undefined
 * @returns Formatted string (e.g. "$150.000") or "-" if null/undefined
 */
export function formatCLP(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
