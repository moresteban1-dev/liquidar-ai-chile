// src/core/domain/pricing/__tests__/TaxConfig.test.ts

import { describe, it, expect } from 'vitest';
import { 
  TAX_CONFIG, 
  calculateTax, 
  calculateGrossFromNet, 
  calculateNetFromGross,
  extractTaxFromGross,
  calculatePriceBreakdown,
  calculatePriceBreakdownFromGross
} from '../TaxConfig';

describe('TaxConfig', () => {
  describe('Constants', () => {
    it('should have IVA rate of 19%', () => {
      expect(TAX_CONFIG.IVA_RATE).toBe(0.19);
      expect(TAX_CONFIG.IVA_PERCENT).toBe(19);
    });

    it('should be Chilean config', () => {
      expect(TAX_CONFIG.COUNTRY).toBe('CL');
      expect(TAX_CONFIG.DEFAULT_CURRENCY).toBe('CLP');
    });
  });

  describe('calculateTax', () => {
    it('should calculate 19% tax on net amount', () => {
      expect(calculateTax(1000)).toBe(190);
      expect(calculateTax(10000)).toBe(1900);
      expect(calculateTax(100)).toBe(19);
    });

    it('should handle zero and negative', () => {
      expect(calculateTax(0)).toBe(0);
      expect(calculateTax(-100)).toBe(0);
    });

    it('should round to 2 decimals', () => {
      expect(calculateTax(33.33)).toBe(6.33); // 33.33 * 0.19 = 6.3327
    });
  });

  describe('calculateGrossFromNet', () => {
    it('should add IVA to net amount', () => {
      expect(calculateGrossFromNet(1000)).toBe(1190);
      expect(calculateGrossFromNet(10000)).toBe(11900);
    });

    it('should handle zero', () => {
      expect(calculateGrossFromNet(0)).toBe(0);
    });
  });

  describe('calculateNetFromGross', () => {
    it('should extract net from gross amount', () => {
      expect(calculateNetFromGross(1190)).toBe(1000);
      expect(calculateNetFromGross(11900)).toBe(10000);
    });

    it('should be inverse of calculateGrossFromNet', () => {
      const net = 1234.56;
      const gross = calculateGrossFromNet(net);
      const recovered = calculateNetFromGross(gross);
      // Puede haber diferencia de centavo por redondeo
      expect(Math.abs(recovered - net)).toBeLessThan(0.02);
    });

    it('should handle zero', () => {
      expect(calculateNetFromGross(0)).toBe(0);
    });
  });

  describe('extractTaxFromGross', () => {
    it('should extract only the tax portion', () => {
      expect(extractTaxFromGross(1190)).toBe(190);
    });
  });

  describe('calculatePriceBreakdown', () => {
    it('should return complete breakdown from net', () => {
      const breakdown = calculatePriceBreakdown(1000);
      
      expect(breakdown.net).toBe(1000);
      expect(breakdown.tax).toBe(190);
      expect(breakdown.gross).toBe(1190);
      expect(breakdown.taxRate).toBe(0.19);
      expect(breakdown.taxName).toBe('IVA');
    });
  });

  describe('calculatePriceBreakdownFromGross', () => {
    it('should return complete breakdown from gross', () => {
      const breakdown = calculatePriceBreakdownFromGross(1190);
      
      expect(breakdown.net).toBe(1000);
      expect(breakdown.tax).toBe(190);
      expect(breakdown.gross).toBe(1190);
      expect(breakdown.taxRate).toBe(0.19);
    });
  });
});
