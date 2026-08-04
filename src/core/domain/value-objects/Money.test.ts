import { describe, it, expect } from 'vitest';
import { Money } from './Money';

describe('Money Value Object', () => {
  describe('Creation', () => {
    it('should create valid money', () => {
      const result = Money.create(100, 'USD');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(100);
      expect(result.getValue().currency).toBe('USD');
    });

    it('should use CLP as default currency', () => {
      const result = Money.create(100);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().currency).toBe('CLP');
    });

    it('should reject negative amounts', () => {
      const result = Money.create(-50, 'USD');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('negative');
    });

    it('should reject invalid currency', () => {
      const result = Money.create(100, 'INVALID' as any);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('3-letter ISO code');
    });

    it('should round to 2 decimals', () => {
      const result = Money.create(10.12345, 'USD');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(10.12);
    });
  });

  describe('Addition', () => {
    it('should add same currency', () => {
      const money1 = Money.create(100, 'USD').getValue();
      const money2 = Money.create(50, 'USD').getValue();
      const result = money1.add(money2);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(150);
      expect(result.getValue().currency).toBe('USD');
    });

    it('should reject adding different currencies', () => {
      const money1 = Money.create(100, 'USD').getValue();
      const money2 = Money.create(50, 'EUR').getValue();
      const result = money1.add(money2);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('cannot add');
    });

    it('should handle decimal addition correctly', () => {
      const money1 = Money.create(10.50, 'USD').getValue();
      const money2 = Money.create(20.25, 'USD').getValue();
      const result = money1.add(money2);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(30.75);
    });
  });

  describe('Subtraction', () => {
    it('should subtract same currency', () => {
      const money1 = Money.create(100, 'USD').getValue();
      const money2 = Money.create(30, 'USD').getValue();
      const result = money1.subtract(money2);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(70);
    });

    it('should reject subtracting different currencies', () => {
      const money1 = Money.create(100, 'USD').getValue();
      const money2 = Money.create(30, 'EUR').getValue();
      const result = money1.subtract(money2);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('cannot subtract');
    });

    it('should reject result that would be negative', () => {
      const money1 = Money.create(50, 'USD').getValue();
      const money2 = Money.create(100, 'USD').getValue();
      const result = money1.subtract(money2);

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('negative');
    });
  });

  describe('Multiplication', () => {
    it('should multiply by positive factor', () => {
      const money = Money.create(100, 'USD').getValue();
      const result = money.multiply(2);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(200);
    });

    it('should multiply by zero', () => {
      const money = Money.create(100, 'USD').getValue();
      const result = money.multiply(0);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(0);
    });

    it('should reject negative factor', () => {
      const money = Money.create(100, 'USD').getValue();
      const result = money.multiply(-2);

      expect(result.isFailure()).toBe(true);
    });

    it('should handle decimal multiplication', () => {
      const money = Money.create(100, 'USD').getValue();
      const result = money.multiply(1.5);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(150);
    });
  });

  describe('Division', () => {
    it('should divide by positive divisor', () => {
      const money = Money.create(100, 'USD').getValue();
      const result = money.divide(2);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(50);
    });

    it('should reject division by zero', () => {
      const money = Money.create(100, 'USD').getValue();
      const result = money.divide(0);

      expect(result.isFailure()).toBe(true);
    });

    it('should reject division by negative', () => {
      const money = Money.create(100, 'USD').getValue();
      const result = money.divide(-2);

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('Percentage', () => {
    it('should calculate percentage', () => {
      const money = Money.create(1000, 'USD').getValue();
      const result = money.percentage(30);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(300);
    });

    it('should handle 0 percent', () => {
      const money = Money.create(1000, 'USD').getValue();
      const result = money.percentage(0);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(0);
    });

    it('should handle 100 percent', () => {
      const money = Money.create(1000, 'USD').getValue();
      const result = money.percentage(100);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(1000);
    });

    it('should reject percent > 100', () => {
      const money = Money.create(1000, 'USD').getValue();
      const result = money.percentage(150);

      expect(result.isFailure()).toBe(true);
    });

    it('should reject negative percent', () => {
      const money = Money.create(1000, 'USD').getValue();
      const result = money.percentage(-10);

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('Apply Discount', () => {
    it('should apply discount', () => {
      const money = Money.create(1000, 'USD').getValue();
      const result = money.applyDiscount(20);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(800);
    });

    it('should handle 100% discount', () => {
      const money = Money.create(1000, 'USD').getValue();
      const result = money.applyDiscount(100);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().amount).toBe(0);
    });
  });

  describe('Comparison', () => {
    it('should check equality', () => {
      const money1 = Money.create(100, 'USD').getValue();
      const money2 = Money.create(100, 'USD').getValue();

      expect(money1.equals(money2)).toBe(true);
    });

    it('should check inequality for different amounts', () => {
      const money1 = Money.create(100, 'USD').getValue();
      const money2 = Money.create(200, 'USD').getValue();

      expect(money1.equals(money2)).toBe(false);
    });

    it('should check inequality for different currencies', () => {
      const money1 = Money.create(100, 'USD').getValue();
      const money2 = Money.create(100, 'EUR').getValue();

      expect(money1.equals(money2)).toBe(false);
    });

    it('should compare greater than', () => {
      const money1 = Money.create(200, 'USD').getValue();
      const money2 = Money.create(100, 'USD').getValue();

      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(false);
    });

    it('should compare less than', () => {
      const money1 = Money.create(100, 'USD').getValue();
      const money2 = Money.create(200, 'USD').getValue();

      expect(money1.isLessThan(money2)).toBe(true);
      expect(money2.isLessThan(money1)).toBe(false);
    });

    it('should return false when comparing different currencies', () => {
      const money1 = Money.create(100, 'USD').getValue();
      const money2 = Money.create(100, 'EUR').getValue();

      expect(money1.isGreaterThan(money2)).toBe(false);
      expect(money1.isLessThan(money2)).toBe(false);
    });
  });

  describe('Predicates', () => {
    it('should check if zero', () => {
      const zero = Money.create(0, 'USD').getValue();
      const nonZero = Money.create(100, 'USD').getValue();

      expect(zero.isZero()).toBe(true);
      expect(nonZero.isZero()).toBe(false);
    });

    it('should check if positive', () => {
      const zero = Money.create(0, 'USD').getValue();
      const positive = Money.create(100, 'USD').getValue();

      expect(zero.isPositive()).toBe(false);
      expect(positive.isPositive()).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should convert to JSON', () => {
      const money = Money.create(100, 'USD').getValue();
      const json = money.toJSON();

      expect(json).toEqual({
        amount: 100,
        currency: 'USD'
      });
    });

    it('should convert to string', () => {
      const money = Money.create(1234.56, 'USD').getValue();
      const str = money.toString();

      expect(str).toBe('USD 1234.56');
    });

    it('should convert to locale string', () => {
      const money = Money.create(1234.56, 'USD').getValue();
      const str = money.format('en-US');

      expect(str).toContain('1,234.56');
    });
  });

  describe('Real-world scenarios', () => {
    it('should calculate price with tax (16%)', () => {
      const basePrice = Money.create(1000, 'MXN').getValue();
      const taxResult = basePrice.percentage(16);
      
      expect(taxResult.isSuccess()).toBe(true);
      
      const totalResult = basePrice.add(taxResult.getValue());
      
      expect(totalResult.isSuccess()).toBe(true);
      expect(totalResult.getValue().amount).toBe(1160);
    });

    it('should calculate commission for Liquidar platform', () => {
      const providerCost = Money.create(10000, 'USD').getValue();
      const commissionRate = 30; // 30%
      
      const commissionResult = providerCost.percentage(commissionRate);
      expect(commissionResult.isSuccess()).toBe(true);
      expect(commissionResult.getValue().amount).toBe(3000);
      
      const clientPriceResult = providerCost.add(commissionResult.getValue());
      expect(clientPriceResult.isSuccess()).toBe(true);
      expect(clientPriceResult.getValue().amount).toBe(13000);
    });

    it('should split bill between people', () => {
      const totalBill = Money.create(300, 'USD').getValue();
      const perPersonResult = totalBill.divide(3);
      
      expect(perPersonResult.isSuccess()).toBe(true);
      expect(perPersonResult.getValue().amount).toBe(100);
    });

    it('should calculate final price with discount and tax', () => {
      const originalPrice = Money.create(1000, 'USD').getValue();
      
      // Apply 20% discount
      const discountedResult = originalPrice.applyDiscount(20);
      expect(discountedResult.isSuccess()).toBe(true);
      expect(discountedResult.getValue().amount).toBe(800);
      
      // Add 16% tax
      const taxResult = discountedResult.getValue().percentage(16);
      expect(taxResult.isSuccess()).toBe(true);
      
      const finalPriceResult = discountedResult.getValue().add(taxResult.getValue());
      expect(finalPriceResult.isSuccess()).toBe(true);
      expect(finalPriceResult.getValue().amount).toBe(928);
    });
  });
});
