import { BaseMappingStage } from '@/core/domain/event-intelligence/engine/stages/BaseMappingStage';
import { InferenceContext } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { IKnowledgeRepository } from '@/core/application/ports/IKnowledgeRepository';
import { ok } from '@/core/shared/Result';
import { describe, it, expect, vi } from 'vitest';

describe('BaseMappingStage', () => {
  it('should map base nodes from repository to needs context', async () => {
    const stage = new BaseMappingStage();
    
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findBaselineNodesByEventType: vi.fn().mockResolvedValue(ok([
        {
          nodeId: 'node-1',
          nodeCode: 'PA_SYSTEM',
          nodeName: 'Sistema de Sonido',
          priority: 1
        },
        {
          nodeId: 'node-2',
          nodeCode: 'COFFEE_BREAK',
          nodeName: 'Servicio de Café',
          priority: 2
        }
      ])),
      findEssentialNodes: vi.fn().mockResolvedValue(ok([]))
    } as any;

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-type-1', attendees: 50, durationHours: 4 },
      repository: mockRepo,
      needs: new Map()
    };

    await stage.execute(context);

    // Assertions
    expect(context.needs.size).toBe(2);
    
    const paNeed = context.needs.get('PA_SYSTEM');
    expect(paNeed).toBeDefined();
    expect(paNeed?.serviceNodeId).toBe('node-1');
    expect(paNeed?.isEssential).toBe(true);
    expect(paNeed?.confidenceScore).toBe(1.0);

    const coffeeNeed = context.needs.get('COFFEE_BREAK');
    expect(coffeeNeed).toBeDefined();
    expect(coffeeNeed?.isEssential).toBe(false);
  });

  it('should include global essential nodes', async () => {
    const stage = new BaseMappingStage();
    
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findBaselineNodesByEventType: vi.fn().mockResolvedValue(ok([])),
      findEssentialNodes: vi.fn().mockResolvedValue(ok([
        {
          id: 'node-global',
          code: 'SUPPORT',
          name: 'Soporte Técnico',
          nodeType: 'STAFF',
          isEssential: true
        }
      ]))
    } as any;

    const context: InferenceContext = {
      profile: { eventTypeId: '1', attendees: 1, durationHours: 1 },
      repository: mockRepo,
      needs: new Map()
    };

    await stage.execute(context);

    expect(context.needs.get('SUPPORT')).toBeDefined();
    expect(context.needs.get('SUPPORT')?.isEssential).toBe(true);
  });
});
