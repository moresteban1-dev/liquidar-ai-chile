import { describe, it, expect, beforeAll } from 'vitest'
import { SupabaseKnowledgeRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseKnowledgeRepository'
import { createClient } from '@supabase/supabase-js'

/**
 * INTEGRATION TEST: SupabaseKnowledgeRepository
 * Verifies that the repository can fetch and map data from the actual (or test) Supabase database.
 */
describe('SupabaseKnowledgeRepository Integration', () => {
  let repo: SupabaseKnowledgeRepository;
  let isSupabaseAvailable = false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  beforeAll(async () => {
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('example.com') || supabaseUrl === 'http://localhost:54321') {
      console.warn('Skipping SupabaseKnowledgeRepository integration tests: Dummy missing credentials');
      return;
    }
    const client = createClient(supabaseUrl, supabaseKey);
    repo = new SupabaseKnowledgeRepository(client);

    // Pre-flight check
    try {
      const res = await repo.findAllEventTypes();
      if (res.isSuccess()) {
        isSupabaseAvailable = true;
      } else {
        console.warn('Skipping SupabaseKnowledgeRepository integration tests: Supabase unreachable', res.getError().message);
      }
    } catch (e) {
      console.warn('Skipping SupabaseKnowledgeRepository integration tests: Supabase exception', e);
    }
  });

  it('should fetch all active event types', async () => {
    if (!isSupabaseAvailable) return; // Skip if no repo
    
    const result = await repo.findAllEventTypes();
    expect(result.isSuccess()).toBe(true);
    
    const eventTypes = result.getValue();
    expect(Array.isArray(eventTypes)).toBe(true);
    if (eventTypes.length > 0) {
      expect(eventTypes[0].code).toBeDefined();
      expect(eventTypes[0].name).toBeDefined();
    }
  });

  it('should find event type by code', async () => {
    if (!isSupabaseAvailable) return;
    
    // We expect SEED data from the migration (CORP_WORKSHOP)
    const result = await repo.findEventTypeByCode('CORP_WORKSHOP');
    expect(result.isSuccess()).toBe(true);
    
    const workshop = result.getValue();
    if (workshop) {
      expect(workshop.name).toBe('Corporate Workshop');
      expect(workshop.baseCategory).toBe('CORPORATE');
    }
  });

  it('should fetch all active service nodes', async () => {
    if (!isSupabaseAvailable) return;
    
    const result = await repo.findAllServiceNodes();
    expect(result.isSuccess()).toBe(true);
    
    const nodes = result.getValue();
    expect(Array.isArray(nodes)).toBe(true);
    if (nodes.length > 0) {
      expect(nodes[0].code).toBeDefined();
      expect(nodes[0].nodeType).toBeDefined();
    }
  });

  it('should find service node by code', async () => {
    if (!isSupabaseAvailable) return;
    
    // We expect SEED data from migration (PROJECTOR)
    const result = await repo.findServiceNodeByCode('PROJECTOR');
    expect(result.isSuccess()).toBe(true);
    
    const projector = result.getValue();
    if (projector) {
      expect(projector.name).toBe('Video Projector');
      expect(projector.nodeType).toBe('EQUIPMENT');
    }
  });

  it('should fetch only essential nodes', async () => {
    if (!isSupabaseAvailable) return;
    
    const result = await repo.findEssentialNodes();
    expect(result.isSuccess()).toBe(true);
    
    const essentials = result.getValue();
    expect(essentials.length).toBeGreaterThan(0);
    expect(essentials.every(n => n.isEssential)).toBe(true);
    
    // SOUND_BASIC is essential in seed
    expect(essentials.some(n => n.code === 'SOUND_BASIC')).toBe(true);
  });
});
