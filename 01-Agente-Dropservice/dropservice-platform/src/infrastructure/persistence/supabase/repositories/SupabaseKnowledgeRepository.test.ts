import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseKnowledgeRepository } from './SupabaseKnowledgeRepository';
import { SupabaseClient } from '@supabase/supabase-js';

describe('SupabaseKnowledgeRepository', () => {
  let repository: SupabaseKnowledgeRepository;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn()
    };
    repository = new SupabaseKnowledgeRepository(mockClient as unknown as SupabaseClient);
  });

  describe('findAllEventTypes', () => {
    it('should return mapped event types', async () => {
      const mockData = [
        { id: '1', code: 'C1', name: 'N1', description: 'D1', base_category: 'CAT1', is_active: true }
      ];
      mockClient.order.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.findAllEventTypes();

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('C1');
      expect(mockClient.from).toHaveBeenCalledWith('event_types');
    });

    it('should throw error on supabase error', async () => {
      mockClient.order.mockResolvedValue({ data: null, error: { message: 'DB Error' } });
      await expect(repository.findAllEventTypes()).rejects.toThrow('DB Error');
    });
  });

  describe('findServiceNodeByCode', () => {
    it('should return a service node if found', async () => {
      const mockData = { id: '1', code: 'S1', name: 'SN1', description: 'SD1', node_type: 'SERVICE', is_essential: true, is_active: true };
      mockClient.single.mockResolvedValue({ data: mockData, error: null });

      const result = await repository.findServiceNodeByCode('S1');

      expect(result?.code).toBe('S1');
      expect(result?.isEssential).toBe(true);
    });

    it('should return null if not found', async () => {
      mockClient.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const result = await repository.findServiceNodeByCode('S1');
      expect(result).toBeNull();
    });
  });
});
