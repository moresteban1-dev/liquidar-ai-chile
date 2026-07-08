import { describe, it, expect } from 'vitest';
import { OrderMapper } from './OrderMapper';
import { Order } from '@core/domain/aggregates/order/Order';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

describe('OrderMapper', () => {
  // OrderMapper uses static methods — no instance needed

  const validPersistence = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    client_id: '123e4567-e89b-12d3-a456-426614174001',
    state: 'DRAFT',
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    delivery_address: 'Av. Reforma 123, CDMX',
    created_at: '2026-03-19T00:00:00.000Z',
    updated_at: '2026-03-19T00:00:00.000Z'
  };

  describe('toDomain', () => {
    it('should map persistence to domain', () => {
      const result = OrderMapper.toDomain(validPersistence);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().orderId.toString()).toBe(validPersistence.id);
      expect(result.getValue().state).toBe('DRAFT');
    });

    it('should map optional fields', () => {
      const withOptionals = {
        ...validPersistence,
        provider_id: '123e4567-e89b-12d3-a456-426614174002',
        special_instructions: 'Handle with care'
      };

      const result = OrderMapper.toDomain(withOptionals);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().props.providerId).toBeDefined();
      expect(result.getValue().props.specialInstructions).toBe('Handle with care');
    });

    it('should handle completed orders', () => {
      const completed = {
        ...validPersistence,
        state: 'COMPLETED',
        completed_at: '2026-06-20T00:00:00.000Z'
      };

      const result = OrderMapper.toDomain(completed);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().props.completedAt).toBeInstanceOf(Date);
    });

    it('should handle cancelled orders', () => {
      const cancelled = {
        ...validPersistence,
        state: 'CANCELLED',
        cancelled_at: '2026-03-20T00:00:00.000Z',
        cancellation_reason: 'Client requested'
      };

      const result = OrderMapper.toDomain(cancelled);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().props.cancelledAt).toBeInstanceOf(Date);
      expect(result.getValue().props.cancellationReason).toBe('Client requested');
    });

    it('should fail on missing required fields', () => {
      const invalid = {
        ...validPersistence,
        client_id: undefined as any
      };

      const result = OrderMapper.toDomain(invalid);

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('toPersistence', () => {
    it('should map domain to persistence', () => {
      const orderResult = Order.create({
        clientId: new UniqueEntityID('client-123'),
        state: 'DRAFT',
        eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        deliveryAddress: 'Av. Reforma 123, CDMX',
        createdAt: new Date('2026-03-19'),
        updatedAt: new Date('2026-03-19')
      });

      expect(orderResult.isSuccess()).toBe(true);
      const order = orderResult.getValue();

      const persistence = OrderMapper.toPersistence(order);

      expect(persistence.client_id).toBe('client-123');
      expect(persistence.status).toBe('EN_REVISION');
      expect(persistence.delivery_address).toBe('Av. Reforma 123, CDMX');
    });

    it('should map optional fields', () => {
      const orderResult = Order.create({
        clientId: new UniqueEntityID('client-123'),
        providerId: new UniqueEntityID('provider-456'),
        state: 'DRAFT',
        eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        deliveryAddress: 'Av. Reforma 123',
        specialInstructions: 'Call before delivery',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const order = orderResult.getValue();
      const persistence = OrderMapper.toPersistence(order);

      expect(persistence.provider_id).toBe('provider-456');
      expect(persistence.client_notes).toBe('Call before delivery');
    });
  });

  describe('Round-trip mapping', () => {
    it('should maintain data integrity', () => {
      // Domain → Persistence → Domain
      const originalResult = Order.create({
        clientId: new UniqueEntityID('client-123'),
        state: 'QUOTATION_PENDING',
        eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        deliveryAddress: 'Av. Reforma 123',
        createdAt: new Date('2026-03-19'),
        updatedAt: new Date('2026-03-19')
      });

      const original = originalResult.getValue();
      const persistence = OrderMapper.toPersistence(original);
      const reconstructedResult = OrderMapper.toDomain(persistence);

      expect(reconstructedResult.isSuccess()).toBe(true);
      const reconstructed = reconstructedResult.getValue();

      expect(reconstructed.orderId.toString()).toBe(original.orderId.toString());
      expect(reconstructed.state).toBe(original.state);
      expect(reconstructed.props.deliveryAddress).toBe(original.props.deliveryAddress);
    });
  });
});
