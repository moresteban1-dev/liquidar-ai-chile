import { describe, it, expect } from 'vitest';
import { Quotation } from '../core/domain/aggregates/quotation/Quotation';
import { UniqueEntityID } from '../core/shared/UniqueEntityID';
import { Money, Currency } from '../core/domain/value-objects/Money';
import { QuotationPricing } from '../core/domain/aggregates/order/QuotationPricing';

describe('Quotation Isolation Test', () => {
  it('should be able to import and create a quotation', () => {
    const pricingRes = QuotationPricing.fromSimpleMarkup(
      Money.create(1000, Currency.MXN).unwrap(),
      20
    );
    
    const quotationRes = Quotation.create({
      orderId: new UniqueEntityID(),
      providerId: new UniqueEntityID(),
      status: 'DRAFT',
      pricing: pricingRes.unwrap(),
      serviceDescription: 'Test',
      includes: [],
      excludes: [],
      validUntil: new Date(),
      estimatedDeliveryDays: 1,
      createdAt: new Date()
    });

    expect(quotationRes.isSuccess()).toBe(true);
    expect(quotationRes.unwrap().status).toBe('DRAFT');
  });
});
