/**
 * @file rut-validator.ts
 * @description Liquidar Platform re-export of RutValidator with additional utilities.
 *
 * The core algorithm lives in src/lib/validators/RutValidator.ts (Módulo 11).
 * This module provides the canonical import path for Liquidar-specific code.
 */

// Re-export the existing NASA-Grade validator
export { RutValidator } from '@/lib/validators/RutValidator';

/**
 * Validates and auto-formats a RUT string as the user types.
 * Handles partial input gracefully (no error for incomplete RUT).
 *
 * @param rawInput - Raw input string from a form field
 * @returns Formatted partial RUT (e.g. "12.345.678-9")
 */
export function formatRutInput(rawInput: string): string {
  // Remove everything except digits and 'k'/'K'
  const clean = rawInput.replace(/[^0-9kK]/g, '').toUpperCase();

  if (clean.length === 0) return '';
  if (clean.length === 1) return clean;

  // Separate body and DV
  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);

  // Format body with dots
  let formattedBody = '';
  let count = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    formattedBody = body.charAt(i) + formattedBody;
    count++;
    if (count % 3 === 0 && i !== 0) {
      formattedBody = '.' + formattedBody;
    }
  }

  return `${formattedBody}-${dv}`;
}

/**
 * Returns a user-friendly validation message for a RUT.
 * Returns null if the RUT is valid.
 *
 * @param rut - RUT string in any format
 * @returns Error message string or null if valid
 */
export function getRutValidationMessage(rut: string): string | null {
  const { RutValidator } = require('@/lib/validators/RutValidator');

  if (!rut || rut.trim() === '') return 'El RUT es requerido';

  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 7) return 'El RUT es muy corto';
  if (clean.length > 9) return 'El RUT es muy largo';

  if (!RutValidator.validate(rut)) {
    return 'El RUT ingresado no es válido';
  }

  return null;
}
