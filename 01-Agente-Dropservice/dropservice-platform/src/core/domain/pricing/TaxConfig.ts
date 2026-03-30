// src/core/domain/pricing/TaxConfig.ts

/**
 * Configuración fiscal centralizada para la plataforma.
 * 
 * IVA fijo al 19% — confirmado por stakeholder (2026-03-27).
 * País: Chile (CL).
 * 
 * Si en el futuro se necesita IVA variable por región,
 * convertir esta constante en un Value Object con lookup
 * por país/región. Por ahora, YAGNI.
 */
export const TAX_CONFIG = {
  /** Tasa de IVA como decimal (0.19 = 19%) */
  IVA_RATE: 0.19,
  
  /** Tasa de IVA como porcentaje entero (19) */
  IVA_PERCENT: 19,
  
  /** País de aplicación fiscal */
  COUNTRY: 'CL',
  
  /** Moneda por defecto */
  DEFAULT_CURRENCY: 'CLP',
  
  /** Nombre del impuesto para display */
  TAX_NAME: 'IVA',
} as const;

/** Tasa de IVA por defecto (para compatibilidad) */
export const DEFAULT_IVA_RATE = TAX_CONFIG.IVA_RATE;

/** Tipo inferido de la configuración fiscal */
export type TaxConfig = typeof TAX_CONFIG;

// ═══════════════════════════════════════════
// Funciones de Cálculo Puras
// Todas son deterministas — mismo input, mismo output
// ═══════════════════════════════════════════

/**
 * Calcula el IVA a partir de un monto neto.
 * 
 * @param netAmount - Monto sin IVA
 * @returns Monto del IVA redondeado a 2 decimales
 * 
 * @example
 * calculateTax(1000) // → 190
 * calculateTax(0)    // → 0
 */
export function calculateTax(netAmount: number): number {
  if (netAmount <= 0) return 0;
  return Math.round(netAmount * TAX_CONFIG.IVA_RATE * 100) / 100;
}

/**
 * Calcula el monto bruto (con IVA) desde un neto.
 * 
 * @param netAmount - Monto sin IVA
 * @returns Monto con IVA incluido
 * 
 * @example
 * calculateGrossFromNet(1000) // → 1190
 */
export function calculateGrossFromNet(netAmount: number): number {
  if (netAmount <= 0) return 0;
  return Math.round(netAmount * (1 + TAX_CONFIG.IVA_RATE) * 100) / 100;
}

/**
 * Extrae el monto neto desde un bruto (con IVA).
 * 
 * @param grossAmount - Monto con IVA incluido
 * @returns Monto sin IVA
 * 
 * @example
 * calculateNetFromGross(1190) // → 1000
 */
export function calculateNetFromGross(grossAmount: number): number {
  if (grossAmount <= 0) return 0;
  return Math.round((grossAmount / (1 + TAX_CONFIG.IVA_RATE)) * 100) / 100;
}

/**
 * Extrae el monto de IVA contenido en un monto bruto.
 * 
 * @param grossAmount - Monto con IVA incluido
 * @returns Solo la porción de IVA
 * 
 * @example
 * extractTaxFromGross(1190) // → 190
 */
export function extractTaxFromGross(grossAmount: number): number {
  if (grossAmount <= 0) return 0;
  const net = calculateNetFromGross(grossAmount);
  return Math.round((grossAmount - net) * 100) / 100;
}

/**
 * Desglose completo de un precio neto.
 * Útil para mostrar en facturas y UI.
 */
export interface PriceBreakdown {
  /** Monto sin impuestos */
  net: number;
  /** Monto del impuesto */
  tax: number;
  /** Monto total con impuestos */
  gross: number;
  /** Tasa aplicada (decimal) */
  taxRate: number;
  /** Nombre del impuesto */
  taxName: string;
}

/**
 * Genera un desglose completo de precio.
 * 
 * @param netAmount - Monto base sin IVA
 * @returns Desglose con net, tax, gross
 * 
 * @example
 * calculatePriceBreakdown(1000) 
 * // → { net: 1000, tax: 190, gross: 1190, taxRate: 0.19, taxName: 'IVA' }
 */
export function calculatePriceBreakdown(netAmount: number): PriceBreakdown {
  const tax = calculateTax(netAmount);
  return {
    net: netAmount,
    tax,
    gross: Math.round((netAmount + tax) * 100) / 100,
    taxRate: TAX_CONFIG.IVA_RATE,
    taxName: TAX_CONFIG.TAX_NAME,
  };
}

/**
 * Genera un desglose desde un monto bruto (reverse).
 * 
 * @param grossAmount - Monto total con IVA
 * @returns Desglose con net, tax, gross
 * 
 * @example
 * calculatePriceBreakdownFromGross(1190)
 * // → { net: 1000, tax: 190, gross: 1190, ... }
 */
export function calculatePriceBreakdownFromGross(grossAmount: number): PriceBreakdown {
  const net = calculateNetFromGross(grossAmount);
  const tax = Math.round((grossAmount - net) * 100) / 100;
  return {
    net,
    tax,
    gross: grossAmount,
    taxRate: TAX_CONFIG.IVA_RATE,
    taxName: TAX_CONFIG.TAX_NAME,
  };
}
