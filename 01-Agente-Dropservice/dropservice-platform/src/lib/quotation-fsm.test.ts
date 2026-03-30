import { describe, it, expect } from 'vitest';
import { VALID_INTERNAL_TRANSITIONS, calculatePricing, calculateCommission } from './quotation-fsm';
import { QuotationInternalStatus } from './types';

describe('Quotation FSM (Finite State Machine)', () => {

    describe('Transitions', () => {
        it('should allow valid DRAFT -> PENDING_ASSIGNMENT', () => {
            const valid = VALID_INTERNAL_TRANSITIONS['DRAFT'].includes('PENDING_ASSIGNMENT');
            expect(valid).toBe(true);
        });

        it('should PREVENT invalid DRAFT -> APPROVED', () => {
            const invalid = VALID_INTERNAL_TRANSITIONS['DRAFT'].includes('APPROVED' as QuotationInternalStatus);
            expect(invalid).toBe(false);
        });

        it('should allow APPROVED -> PAID', () => {
            const valid = VALID_INTERNAL_TRANSITIONS['APPROVED'].includes('PAID');
            expect(valid).toBe(true);
        });

        // RED TEST: Intentional check for a missing transition or logic gap
        // Let's verify if 'REJECTED' is a terminal state (should have no outgoing transitions)
        it('should be a terminal state for REJECTED', () => {
            expect(VALID_INTERNAL_TRANSITIONS['REJECTED']).toEqual([]);
        });
    });

    describe('Pricing Logic', () => {
        it('should calculate IVA correctly (19%)', () => {
            const result = calculatePricing(1000, 0); // Cost 1000, margin 0
            expect(result.priceNet).toBe(1000);
            expect(result.priceIva).toBe(190);
            expect(result.priceTotal).toBe(1190);
        });

        it('should calculate Markup correctly', () => {
            const result = calculatePricing(1000, 50); // Cost 1000, margin 50%
            // 50% of 1000 is 500. Net should be 1500.
            expect(result.markupAmount).toBe(500);
            expect(result.priceNet).toBe(1500);
            expect(result.priceIva).toBe(Math.round(1500 * 0.19)); // 285
            expect(result.priceTotal).toBe(1500 + 285); // 1785
        });
    });

    describe('Commission Logic V2', () => {
        it('should calculate MONTO_FIJO correctly', () => {
            const result = calculateCommission({
                method: 'MONTO_FIJO',
                subtotalServicesProvider: 10000,
                subtotalLogisticsProvider: 2000,
                fixedCommissionServices: 3000,
                fixedCommissionLogistics: 500
            });
            expect(result.totalCommissionNet).toBe(3500);
            expect(result.totalNet).toBe(15500); // 12000 + 3500
            expect(result.totalWithIva).toBe(15500 + Math.round(15500 * 0.19));
        });

        it('should calculate PORCENTAJE correctly', () => {
            const result = calculateCommission({
                method: 'PORCENTAJE',
                subtotalServicesProvider: 10000,
                subtotalLogisticsProvider: 5000,
                globalPercentage: 10
            });
            expect(result.commissionServicesNet).toBe(1000); // 10%
            expect(result.commissionLogisticsNet).toBe(500); // 10%
            expect(result.totalCommissionNet).toBe(1500);
            expect(result.totalNet).toBe(16500);
        });
    });
});
