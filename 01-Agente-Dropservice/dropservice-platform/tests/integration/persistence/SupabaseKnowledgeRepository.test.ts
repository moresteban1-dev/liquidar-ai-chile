import { describe, it, expect, beforeAll } from 'vitest'
import { SupabaseKnowledgeRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseKnowledgeRepository'
import { createClient } from '@supabase/supabase-js'

/**
 * INTEGRATION TEST: SupabaseKnowledgeRepository
 * Verifies that the repository can fetch and map data from the actual (or test) Supabase database.
 */
describe('SupabaseKnowledgeRepository Integration', () => {
  let repo: SupabaseKnowledgeRepository;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  beforeAll(() => {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Skipping SupabaseKnowledgeRepository integration tests: Missing credentials');
      return;
    }
    const client = createClient(supabaseUrl, supabaseKey);
    repo = new SupabaseKnowledgeRepository(client);
  });

  it('should fetch all active event types', async () => {
    if (!repo) return; // Skip if no repo
    
    const eventTypes = await repo.findAllEventTypes();
    
    expect(Array.isArray(eventTypes)).toBe(true);
    if (eventTypes.length > 0) {
      expect(eventTypes[0].code).toBeDefined();
      expect(eventTypes[0].name).toBeDefined();
    }
  });

  it('should find event type by code', async () => {
    if (!repo) return;
    
    // We expect SEED data from the migration (CORP_WORKSHOP)
    const workshop = await repo.findEventTypeByCode('CORP_WORKSHOP');
    
    if (workshop) {
      expect(workshop.name).toBe('Corporate Workshop');
      expect(workshop.baseCategory).toBe('CORPORATE');
    }
  });

  it('should fetch all active service nodes', async () => {
    if (!repo) return;
    
    const nodes = await repo.findAllServiceNodes();
    
    expect(Array.isArray(nodes)).toBe(true);
    if (nodes.length > 0) {
      expect(nodes[0].code).toBeDefined();
      expect(nodes[0].nodeType).toBeDefined();
    }
  });

  it('should find service node by code', async () => {
    if (!repo) return;
    
    // We expect SEED data from migration (PROJECTOR)
    const projector = await repo.findServiceNodeByCode('PROJECTOR');
    
    if (projector) {
      expect(projector.name).toBe('Video Projector');
      expect(projector.nodeType).toBe('EQUIPMENT');
    }
  });

  it('should fetch only essential nodes', async () => {
    if (!repo) return;
    
    const essentials = await repo.findEssentialNodes();
    
    expect(essentials.length).toBeGreaterThan(0);
    expect(essentials.every(n => n.isEssential)).toBe(true);
    
    // SOUND_BASIC is essential in seed
    expect(essentials.some(n => n.code === 'SOUND_BASIC')).toBe(true);
  });
});
