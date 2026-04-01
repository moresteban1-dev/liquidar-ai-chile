// src/core/domain/value-objects/__tests__/Money.test.ts

import { describe, it, expect } from 'vitest';
import { Money } from '../Money';

describe('Money', () => {
  // ─── Factory ───
  
  describe('create', () => {
    it('should create Money with valid amount and currency', () => {
      const result = Money.create(1000, 'CLP');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(1000);
      expect(result.getValue().currency).toBe('CLP');
    });

    it('should default to CLP', () => {
      const result = Money.create(500);
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().currency).toBe('CLP');
    });

    it('should uppercase currency', () => {
      const result = Money.create(100, 'usd');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().currency).toBe('USD');
    });

    it('should round to 2 decimals', () => {
      const result = Money.create(10.999, 'USD');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(11.0);
    });

    it('should reject negative amount', () => {
      const result = Money.create(-100, 'CLP');
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('negative');
    });

    it('should reject NaN', () => {
      const result = Money.create(NaN, 'CLP');
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('finite');
    });
  });

  describe('zero', () => {
    it('should create zero amount', () => {
      const zero = Money.zero('CLP');
      expect(zero.amount).toBe(0);
      expect(zero.isZero()).toBe(true);
    });
  });

  // ─── Arithmetic ───

  describe('add', () => {
    it('should add two Money of same currency', () => {
      const a = Money.create(1000, 'CLP').getValue();
      const b = Money.create(500, 'CLP').getValue();
      const result = a.add(b);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(1500);
    });

    it('should fail for different currencies', () => {
      const clp = Money.create(1000, 'CLP').getValue();
      const usd = Money.create(500, 'USD').getValue();
      const result = clp.add(usd);

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('subtract', () => {
    it('should subtract when result is positive', () => {
      const a = Money.create(1000, 'CLP').getValue();
      const b = Money.create(300, 'CLP').getValue();
      const result = a.subtract(b);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(700);
    });

    it('should fail when result would be negative', () => {
      const a = Money.create(100, 'CLP').getValue();
      const b = Money.create(500, 'CLP').getValue();
      const result = a.subtract(b);

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('multiply', () => {
    it('should multiply by factor', () => {
      const price = Money.create(1000, 'CLP').getValue();
      const result = price.multiply(3);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(3000);
    });
  });

  describe('percentage', () => {
    it('should calculate percentage', () => {
      const subtotal = Money.create(1000, 'CLP').getValue();
      const result = subtotal.percentage(19);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(190);
    });
  });

  // ─── Comparisons ───

  describe('isGreaterThan', () => {
    it('should return true when greater', () => {
      const a = Money.create(1000, 'CLP').getValue();
      const b = Money.create(500, 'CLP').getValue();
      expect(a.isGreaterThan(b)).toBe(true);
    });

    it('should return false for different currencies (NO THROW)', () => {
      const clp = Money.create(1000, 'CLP').getValue();
      const usd = Money.create(1, 'USD').getValue();
      
      // Verificación de que no explota
      expect(clp.isGreaterThan(usd)).toBe(false);
    });
  });

  // ─── Immutability ───
  
  describe('immutability', () => {
    it('should not allow mutation', () => {
      const money = Money.create(1000, 'CLP').getValue();
      expect(() => {
        (money as any)._amount = 9999;
      }).toThrow();
    });
  });
});
