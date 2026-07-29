/**
 * @file clp-formatter.ts
 * @description Chilean Peso (CLP) formatter following the Liquidar Platform standard.
 *
 * CLP format: $1.250.000 (no decimals, dot as thousands separator)
 * Uses Intl.NumberFormat with 'es-CL' locale — browser and Node compatible.
 */

/**
 * Provides static methods for formatting and parsing Chilean Peso (CLP) amounts.
 * All amounts are treated as integers (CLP has no decimal cents in practice).
 */
export class CLPFormatter {
  private static readonly FORMATTER = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  /**
   * Formats a number as Chilean Pesos.
   * @param amount - Integer amount in CLP
   * @returns Formatted string, e.g. "$1.250.000"
   * @example CLPFormatter.format(1250000) // "$1.250.000"
   * @example CLPFormatter.format(0) // "$0"
   */
  public static format(amount: number): string {
    if (!Number.isFinite(amount)) return '$0';
    return this.FORMATTER.format(Math.round(amount));
  }

  /**
   * Parses a formatted CLP string back to a number.
   * @param str - Formatted string, e.g. "$1.250.000"
   * @returns Integer amount, e.g. 1250000
   * @example CLPFormatter.parse('$1.250.000') // 1250000
   */
  public static parse(str: string): number {
    if (!str || typeof str !== 'string') return 0;
    // Remove currency symbol, dots (thousands separators), and whitespace
    const cleaned = str.replace(/[$\s.]/g, '').replace(/,/g, '');
    const parsed = parseInt(cleaned, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Formats a CLP amount in compact form for dashboards and KPIs.
   * @param amount - Integer amount in CLP
   * @returns Compact string, e.g. "$1.5M", "$150K"
   * @example CLPFormatter.formatCompact(1500000) // "$1.5M"
   * @example CLPFormatter.formatCompact(150000) // "$150K"
   */
  public static formatCompact(amount: number): string {
    if (!Number.isFinite(amount)) return '$0';
    const abs = Math.abs(amount);
    if (abs >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount}`;
  }

  /**
   * Formats a number as CLP with explicit increment display.
   * Useful for showing bid increments.
   * @param amount - Integer amount in CLP
   * @returns Formatted string with "+" prefix, e.g. "+$1.000"
   */
  public static formatIncrement(amount: number): string {
    return `+${this.format(amount)}`;
  }
}
