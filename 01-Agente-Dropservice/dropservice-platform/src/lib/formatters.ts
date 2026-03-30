/**
 * Formatting Utilities
 * Centralized formatting functions for currency, dates, and file sizes.
 * Supports multi-currency (CLP, USD) via a configurable system currency.
 */

// ─── Currency Configuration ─────────────────────────────────

export type SupportedCurrency = 'CLP' | 'USD';

const CURRENCY_CONFIG: Record<SupportedCurrency, { locale: string; decimals: number }> = {
    CLP: { locale: 'es-CL', decimals: 0 },
    USD: { locale: 'en-US', decimals: 2 },
};

/**
 * Returns the system's default currency from env or falls back to CLP.
 */
function getDefaultCurrency(): SupportedCurrency {
    const envCurrency = (typeof process !== 'undefined'
        ? process.env.NEXT_PUBLIC_DEFAULT_CURRENCY
        : undefined) as string | undefined;

    if (envCurrency && envCurrency in CURRENCY_CONFIG) {
        return envCurrency as SupportedCurrency;
    }
    return 'CLP';
}

/**
 * Format a number as the specified currency.
 * @param amount - Numeric value
 * @param currency - ISO 4217 code (defaults to system currency)
 * @example formatCurrency(150000)        => "$150.000"     (CLP default)
 * @example formatCurrency(49.99, 'USD')  => "$49.99"
 */
export function formatCurrency(amount: number, currency?: SupportedCurrency): string {
    const cur = currency ?? getDefaultCurrency();
    const config = CURRENCY_CONFIG[cur];
    return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: cur,
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
    }).format(amount);
}

/**
 * Format currency in compact form for dashboard KPIs (e.g. "$150K", "$1.2M").
 * @example formatCurrencyCompact(1500000) => "$1.5M"
 */
export function formatCurrencyCompact(amount: number, currency?: SupportedCurrency): string {
    const cur = currency ?? getDefaultCurrency();
    const symbol = cur === 'USD' ? 'US$' : '$';
    if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(0)}K`;
    return `${symbol}${amount}`;
}

/**
 * Format a number as Chilean Pesos (CLP).
 * Backward-compatible alias for `formatCurrency(amount, 'CLP')`.
 * @example formatCLP(150000) => "$150.000"
 */
export function formatCLP(amount: number): string {
    return formatCurrency(amount, 'CLP');
}

/**
 * Format a date string in short Chilean format (DD/MM/YYYY)
 * @example formatDateShort("2026-03-15") => "15/03/2026"
 */
export function formatDateShort(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        return new Intl.DateTimeFormat('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    } catch {
        return 'Fecha inválida';
    }
}

/**
 * Format a date string in readable Chilean format (e.g. "15 mar 2026")
 * @example formatDateReadable("2026-03-15") => "15 mar 2026"
 */
export function formatDateReadable(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '-';
    }
}

/**
 * Format bytes into human-readable file size
 * @example formatBytes(1536) => "1.5 KB"
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
