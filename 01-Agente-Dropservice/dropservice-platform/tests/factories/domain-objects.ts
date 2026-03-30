import { Quotation } from '@core/domain/aggregates/quotation/Quotation';

/**
 * Factory para crear objetos Quotation de prueba
 */
export function createTestQuotation(overrides: any = {}): Quotation {
  return Quotation.create({
    id: overrides.id || 'quot-test-001',
    description: overrides.description || 'Test Quotation',
    status: overrides.status || 'DRAFT',
    requestedItems: overrides.items || [
      { description: 'Service A', quantity: 1, unitCost: 100, total: 100 }
    ],
    clientId: overrides.clientId || 'client-test-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides.props
  }).getValue();
}
