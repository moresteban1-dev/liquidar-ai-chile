import { OrderMapper } from '@/infrastructure/persistence/supabase/mappers/OrderMapper';
import { QuotationMapper } from '@/infrastructure/persistence/supabase/mappers/QuotationMapper';
import {
  createTestOrder,
  createTestQuotation,
  TEST_IDS,
} from '../../setup/test-factories';

describe('Mapper Round-Trip — Data Integrity', () => {
  describe('OrderMapper', () => {
    it('should preserve all fields through toPersistence → toDomain', () => {
      // OrderMapper uses static methods
      const original = createTestOrder({
        state: 'QUOTATION_PENDING',
        providerId: TEST_IDS.provider,
      });

      // Domain → Persistence (instance method)
      const persisted = OrderMapper.toPersistence(original);

      expect(persisted.id).toBe(original.id.toString());
      expect(persisted.client_id).toBe(original.clientId.toString());

      // Persistence → Domain (instance method)
      const restored = OrderMapper.toDomain(persisted);

      expect(restored.isSuccess()).toBe(true);
      const restoredOrder = restored.getValue();

      // Verify key fields
      expect(restoredOrder.id.toString()).toBe(original.id.toString());
      expect(restoredOrder.clientId.toString()).toBe(original.clientId.toString());
      expect(restoredOrder.state).toBe(original.state);
    });
  });

  describe('QuotationMapper', () => {
    it('should preserve pricing through toPersistence → toDomain', () => {
      const original = createTestQuotation({
        providerCost: 45000,
        adminMargin: 9000,
        clientPrice: 54000,
        currency: 'MXN',
      });

      const mapper = new QuotationMapper();
      const persisted = mapper.toPersistence(original);
      const restored = mapper.toDomain(persisted);

      expect(restored.isSuccess()).toBe(true);
      const restoredQuot = restored.getValue();

      expect(restoredQuot.pricing.providerCost.amount).toBe(45000);
      expect(restoredQuot.pricing.adminCommission.amount).toBe(9000);
      expect(restoredQuot.pricing.finalPrice.amount).toBe(54000);
    });

    it('should preserve items array through round-trip', () => {
      const original = createTestQuotation({
        items: [
          { description: 'Item A', quantity: 3, unitCost: 5000 },
          { description: 'Item B', quantity: 1, unitCost: 25000 },
        ],
      });

      const mapper = new QuotationMapper();
      const persisted = mapper.toPersistence(original);
      const restored = mapper.toDomain(persisted);

      expect(restored.isSuccess()).toBe(true);
      const items = restored.getValue().items;
      expect(items.length).toBe(2);
      expect(items[0].description).toBe('Item A');
    });
  });
});

