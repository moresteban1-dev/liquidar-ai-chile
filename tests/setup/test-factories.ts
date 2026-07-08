/**
 * Domain object factories for consistent test data creation.
 * Every test uses these factories to avoid brittle, duplicated setup code.
 */

import { Order } from '@/core/domain/aggregates/order/Order';
import { Quotation } from '@/core/domain/aggregates/quotation/Quotation';
import { QuotationPricing } from '@/core/domain/aggregates/order/QuotationPricing';
import { UniqueEntityID } from '@/core/shared/UniqueEntityID';
import { OrderState } from '@/core/domain/aggregates/order/OrderState';
import { Money } from '@/core/domain/value-objects/Money';

// ═══════════════════════════════════════════════════════════
// Default IDs (deterministic for assertions)
// ═══════════════════════════════════════════════════════════

export const TEST_IDS = {
  client: '00000000-0000-0000-0000-000000000001',
  provider: '00000000-0000-0000-0000-000000000002',
  admin: '00000000-0000-0000-0000-000000000003',
  order: '00000000-0000-0000-0000-000000000010',
  quotation: '00000000-0000-0000-0000-000000000020',
  webhook: '00000000-0000-0000-0000-000000000030',
  service: '00000000-0000-0000-0000-000000000040',
} as const;

// ═══════════════════════════════════════════════════════════
// Order Factory
// ═══════════════════════════════════════════════════════════

export interface OrderOverrides {
  id?: string;
  clientId?: string;
  title?: string;
  description?: string;
  eventType?: string;
  eventDate?: Date;
  state?: OrderState;
  providerId?: string;
}

export function createTestOrder(overrides: OrderOverrides = {}): Order {
  const result = Order.create({
    clientId: new UniqueEntityID(overrides.clientId ?? TEST_IDS.client),
    state: overrides.state ?? 'DRAFT',
    eventDate: overrides.eventDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in the future
    deliveryAddress: 'Test Address 123',
    createdAt: new Date(),
    updatedAt: new Date(),
  }, new UniqueEntityID(overrides.id ?? TEST_IDS.order));

  if (result.isFailure()) {
    throw new Error(`Test order creation failed: ${result.getError()}`);
  }

  const order = result.getValue();

  if (overrides.providerId) {
      order.assignProvider(new UniqueEntityID(overrides.providerId));
  }

  // Clear domain events generated during setup
  order.clearEvents();

  return order;
}

// ═══════════════════════════════════════════════════════════
// Quotation Factory
// ═══════════════════════════════════════════════════════════

export interface QuotationOverrides {
  id?: string;
  orderId?: string;
  providerId?: string;
  providerCost?: number;
  adminMargin?: number;
  clientPrice?: number;
  currency?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitCost: number;
  }>;
  clientId?: string;
  serviceId?: string;
  code?: string;
  status?: string;
  serviceDescription?: string;
  includes?: string[];
  excludes?: string[];
  estimatedDeliveryDays?: number;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export function createTestQuotation(
  overrides: QuotationOverrides = {},
): Quotation {
  const providerCost = overrides.providerCost ?? 30000;
  const adminMargin = overrides.adminMargin ?? 6000;
  const clientPrice = overrides.clientPrice ?? 36000;
  const currency = overrides.currency ?? 'MXN';

  const pricingResult = QuotationPricing.create({
    providerCost: providerCost,
    adminMargin: adminMargin,
    clientPrice: clientPrice,
    currency,
  });

  const pricing = pricingResult.getValue();
  const zero = Money.create(0, pricing.providerCost.currency as any).unwrap();

  const result = Quotation.create(
    {
      orderId: new UniqueEntityID(overrides.orderId ?? TEST_IDS.order),
      providerId: new UniqueEntityID(overrides.providerId ?? TEST_IDS.provider),
      clientId: overrides.clientId ?? TEST_IDS.client,
      serviceId: overrides.serviceId ?? TEST_IDS.service,
      code: overrides.code ?? 'QT-TEST-001',
      status: overrides.status ?? 'DRAFT',
      pricing: pricing,
      
      // Flat Financials (Sync with Pricing VO)
      subtotalServicesProvider: pricing.providerCost,
      subtotalLogisticsProvider: zero,
      totalProviderNet: pricing.providerCost,
      commissionServicesNet: pricing.adminCommission,
      commissionLogisticsNet: zero,
      totalCommissionNet: pricing.adminCommission.add(pricing.platformFee).unwrap(),
      commissionMethod: 'PORCENTAJE',
      totalNet: pricing.finalPrice.subtract(pricing.taxes).unwrap(),
      totalIva: pricing.taxes,
      totalWithIva: pricing.finalPrice,

      providerSuggestsTechnicalVisit: false,
      technicalVisit: false,
      
      serviceDescription: overrides.serviceDescription ?? 'Test service description',
      includes: overrides.includes ?? ['Feature 1', 'Feature 2'],
      excludes: overrides.excludes ?? ['Not included 1'],
      estimatedDeliveryDays: overrides.estimatedDeliveryDays ?? 5,
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      items: overrides.items ?? [
        { description: 'Sound System', quantity: 1, unitCost: 15000 },
        { description: 'Lighting Package', quantity: 1, unitCost: 10000 },
        { description: 'Stage Setup', quantity: 1, unitCost: 5000 },
      ],
      providerNotes: 'Test quotation for integration testing',
      validUntil: new Date('2026-05-01T23:59:59Z'),
      eventDate: new Date('2026-09-15T12:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(overrides.id ?? TEST_IDS.quotation),
  );

  if (result.isFailure()) {
    throw new Error(`Test quotation creation failed: ${result.getError()}`);
  }

  const quotation = result.getValue();
  quotation.clearEvents();

  return quotation;
}

// ═══════════════════════════════════════════════════════════
// User/Profile Factory (for notification tests)
// ═══════════════════════════════════════════════════════════

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'provider' | 'client';
}

export const TEST_USERS: Record<string, TestUser> = {
  client: {
    id: TEST_IDS.client,
    email: 'maria.garcia@example.com',
    name: 'María García',
    role: 'client',
  },
  provider: {
    id: TEST_IDS.provider,
    email: 'carlos.lopez@eventospro.com',
    name: 'Carlos López (EventosPro)',
    role: 'provider',
  },
  admin: {
    id: TEST_IDS.admin,
    email: 'admin@dropservice.com',
    name: 'Admin DropService',
    role: 'admin',
  },
};
