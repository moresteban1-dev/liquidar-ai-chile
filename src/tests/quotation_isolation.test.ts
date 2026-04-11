import { describe, it, expect } from 'vitest';
import { Quotation } from '../core/domain/aggregates/quotation/Quotation';
import { UniqueEntityID } from '../core/shared/UniqueEntityID';
import { Money } from '../core/domain/value-objects/Money';
import { QuotationPricing } from '../core/domain/aggregates/order/QuotationPricing';

describe('Quotation Isolation Test', () => {
  it('should be able to import and create a quotation', () => {
    const pricingRes = QuotationPricing.fromSimpleMarkup(
      Money.create(1000, 'MXN').getValue(),
      20
    );
    
    const quotationRes = Quotation.create({
      orderId: new UniqueEntityID(),
      providerId: new UniqueEntityID(),
      clientId: 'client-1',
      serviceId: 'service-1',
      code: 'Q-TEST-001',
      status: 'DRAFT',
      pricing: pricingRes.getValue(),
      serviceDescription: 'Test',
      includes: [],
      excludes: [],
      validUntil: new Date(),
      estimatedDeliveryDays: 1,
      eventDate: new Date(),
      createdAt: new Date(),
      requestedItems: [],
      providerItems: [],
      clientItems: [],
      items: [],
      subtotalServicesProvider: Money.zero('MXN'),
      subtotalLogisticsProvider: Money.zero('MXN'),
      totalProviderNet: Money.zero('MXN'),
      commissionServicesNet: Money.zero('MXN'),
      commissionLogisticsNet: Money.zero('MXN'),
      totalCommissionNet: Money.zero('MXN'),
      commissionMethod: 'PERCENTAGE',
      totalNet: Money.zero('MXN'),
      totalIva: Money.zero('MXN'),
      totalWithIva: Money.zero('MXN'),
      providerSuggestsTechnicalVisit: false,
      technicalVisit: false,
      expiresAt: new Date()
    });

    expect(quotationRes.isSuccess()).toBe(true);
    expect(quotationRes.getValue().status).toBe('DRAFT');
  });
});
