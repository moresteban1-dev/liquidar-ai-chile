import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseKnowledgeRepository } from './SupabaseKnowledgeRepository';
import { SupabaseClient } from '@supabase/supabase-js';

describe('SupabaseKnowledgeRepository', () => {
  let repository: SupabaseKnowledgeRepository;
  let mockClient: any;

  /**
   * Creates a chainable mock where every method returns `this`
   * except `order()` and `single()` which resolve to the given data.
   */
  const createChainableMock = (resolveFn: (...args: any[]) => any) => {
    const chain: any = {};
    const self = () => chain;
    chain.from = vi.fn().mockImplementation(self);
    chain.select = vi.fn().mockImplementation(self);
    chain.eq = vi.fn().mockImplementation(self);
    chain.order = vi.fn().mockImplementation(resolveFn);
    chain.single = vi.fn().mockImplementation(resolveFn);
    return chain;
  };

  describe('findAllEventTypes', () => {
    it('should return mapped event types', async () => {
      const mockData = [
        { id: '1', code: 'C1', name: 'N1', description: 'D1', base_category: 'CAT1', is_active: true }
      ];
      mockClient = createChainableMock(() => Promise.resolve({ data: mockData, error: null }));
      repository = new SupabaseKnowledgeRepository(mockClient as unknown as SupabaseClient);

      const result = await repository.findAllEventTypes();

      expect(result.isSuccess()).toBe(true);
      const eventTypes = result.getValue();
      expect(eventTypes).toHaveLength(1);
      expect(eventTypes[0].code).toBe('C1');
      expect(mockClient.from).toHaveBeenCalledWith('event_types');
    });

    it('should return failure on supabase error', async () => {
      mockClient = createChainableMock(() => Promise.resolve({ data: null, error: { message: 'DB Error' } }));
      repository = new SupabaseKnowledgeRepository(mockClient as unknown as SupabaseClient);

      const result = await repository.findAllEventTypes();

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toContain('DB Error');
    });
  });

  describe('findServiceNodeByCode', () => {
    it('should return a service node if found', async () => {
      const mockData = { id: '1', code: 'S1', name: 'SN1', description: 'SD1', node_type: 'SERVICE', is_essential: true, is_active: true };
      mockClient = createChainableMock(() => Promise.resolve({ data: mockData, error: null }));
      repository = new SupabaseKnowledgeRepository(mockClient as unknown as SupabaseClient);

      const result = await repository.findServiceNodeByCode('S1');

      expect(result.isSuccess()).toBe(true);
      const node = result.getValue();
      expect(node?.code).toBe('S1');
      expect(node?.isEssential).toBe(true);
    });

    it('should return ok(null) if not found (PGRST116)', async () => {
      mockClient = createChainableMock(() => Promise.resolve({ data: null, error: { message: 'Not found', code: 'PGRST116' } }));
      repository = new SupabaseKnowledgeRepository(mockClient as unknown as SupabaseClient);

      const result = await repository.findServiceNodeByCode('S1');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBeNull();
    });
  });
});
