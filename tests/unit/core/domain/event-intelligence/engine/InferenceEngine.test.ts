import { InferenceEngine } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { IKnowledgeRepository } from '@/core/application/ports/IKnowledgeRepository';
import { EventProfile } from '@/core/domain/event-intelligence/types';
import { ok, fail } from '@/core/shared/Result';
import { describe, it, expect, vi } from 'vitest';

describe('InferenceEngine', () => {
  it('should run the complete pipeline and return sorted results', async () => {
    // 1. Setup Mock Repository
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findAllEventTypes: vi.fn(),
      findEventTypeByCode: vi.fn(),
      findAllServiceNodes: vi.fn(),
      findServiceNodeByCode: vi.fn(),
      findServiceNodeById: vi.fn(),
      findEssentialNodes: vi.fn().mockResolvedValue(ok([])),
      findDependenciesByParentId: vi.fn().mockResolvedValue(ok([])),
      findBaselineNodesByEventType: vi.fn(),
      findScalingRulesByNodeId: vi.fn().mockResolvedValue(ok([])),
      saveConfigurationSession: vi.fn(),
      getConfigurationSession: vi.fn()
    } as any;

    const engine = new InferenceEngine(mockRepo);

    // 2. Setup Mock Data
    const mockBaseline = [
      {
        nodeId: 'node-main',
        nodeCode: 'MAIN_SERVICE',
        nodeName: 'Servicio Principal',
        priority: 1
      }
    ];

    vi.mocked(mockRepo.findBaselineNodesByEventType).mockResolvedValue(ok(mockBaseline));

    // 3. Run Inference
    const profile: EventProfile = {
      eventTypeId: 'evt-type-123',
      attendees: 250,
      durationHours: 6
    };

    const result = await engine.runInference(profile);

    // 4. Assertions
    expect(result.isSuccess()).toBe(true);
    const results = result.getValue();
    expect(results).toHaveLength(1);
    
    // Check Main Service
    const main = results.find(r => r.nodeCode === 'MAIN_SERVICE');
    expect(main).toBeDefined();
    expect(main?.quantityInferred).toBe(1);
    expect(main?.isEssential).toBe(true);
  });

  it('should pass if no baseline nodes are found', async () => {
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findBaselineNodesByEventType: vi.fn().mockResolvedValue(ok([])),
      findEssentialNodes: vi.fn().mockResolvedValue(ok([])),
    } as any;

    const engine = new InferenceEngine(mockRepo);
    
    const result = await engine.runInference({ eventTypeId: 'empty', attendees: 1, durationHours: 1 });
    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toHaveLength(0);
  });

  it('should return failure if repository fails', async () => {
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findBaselineNodesByEventType: vi.fn().mockResolvedValue(fail(new Error('DB Error'))),
    } as any;

    const engine = new InferenceEngine(mockRepo);
    
    const result = await engine.runInference({ eventTypeId: 'error', attendees: 1, durationHours: 1 });
    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe('DB Error');
  });
});
