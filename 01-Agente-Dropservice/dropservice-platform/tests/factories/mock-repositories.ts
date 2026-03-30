import { vi } from 'vitest';
import { ok, fail } from '@core/shared/Result';

/**
 * Crea un mock completo de QuotationRepository
 */
export function createMockQuotationRepository(): any {
  return {
    findById: vi.fn().mockResolvedValue(fail('Not configured')),
    save: vi.fn().mockResolvedValue(ok(undefined)),
    findByStatus: vi.fn().mockResolvedValue(ok([])),
    findPending: vi.fn().mockResolvedValue(ok([])),
    search: vi.fn().mockResolvedValue(ok([])),
  };
}

/**
 * Crea un mock completo de OrderRepository
 */
export function createMockOrderRepository(): any {
  return {
    findById: vi.fn().mockResolvedValue(fail('Not configured')),
    save: vi.fn().mockResolvedValue(ok(undefined)),
    findByStatus: vi.fn().mockResolvedValue(ok([])),
    findByClientId: vi.fn().mockResolvedValue(ok([])),
    count: vi.fn().mockResolvedValue(ok(0)),
    delete: vi.fn().mockResolvedValue(ok(undefined)),
  };
}
