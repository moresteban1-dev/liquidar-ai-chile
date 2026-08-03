/**
 * @file index.ts
 * @description Barrel export for all Chile-specific modules.
 * Single import point for Liquidar Platform Chile utilities.
 */

export { CLPFormatter } from './clp-formatter';
export { RutValidator, formatRutInput, getRutValidationMessage } from './rut-validator';
export { RegionsCommunes } from './regions-communes';
export type { Region, Commune } from './regions-communes';
export { calculateAuctionFees, AUCTION_FEE_RATES } from './auction-calculator';
export type { FeeBreakdown } from './auction-calculator';
