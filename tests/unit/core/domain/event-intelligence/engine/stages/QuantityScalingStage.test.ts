import { QuantityScalingStage } from '@/core/domain/event-intelligence/engine/stages/QuantityScalingStage';
import { InferenceContext } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { IKnowledgeRepository } from '@/core/application/ports/IKnowledgeRepository';
import { ok } from '@/core/shared/Result';
import { describe, it, expect, vi } from 'vitest';

describe('QuantityScalingStage', () => {
  it('should apply "LINEAR" scaling rules (e.g. 1 chair per attendee)', async () => {
    const stage = new QuantityScalingStage();
    
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findScalingRulesByNodeId: vi.fn().mockResolvedValue(ok([
        {
          nodeId: 'node-chair',
          ruleType: 'LINEAR',
          parameterTarget: 'ATTENDEES',
          baseQuantity: 1,
          divisor: 1,
          maxQuantity: 0
        }
      ]))
    } as any;

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 150, durationHours: 4 },
      repository: mockRepo,
      needs: new Map([
        ['CHAIR', {
          serviceNodeId: 'node-chair',
          nodeCode: 'CHAIR',
          nodeName: 'Silla',
          quantityInferred: 1,
          isEssential: true,
          reasoning: ['Base'],
          confidenceScore: 1.0
        }]
      ])
    };

    await stage.execute(context);

    expect(context.needs.get('CHAIR')?.quantityInferred).toBe(150);
  });

  it('should apply "STAIRCASE" scaling rules (e.g. 1 bathroom per 100 attendees)', async () => {
    const stage = new QuantityScalingStage();
    
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findScalingRulesByNodeId: vi.fn().mockResolvedValue(ok([
        {
          nodeId: 'node-bath',
          ruleType: 'STAIRCASE',
          parameterTarget: 'ATTENDEES',
          baseQuantity: 1,
          divisor: 100,
          maxQuantity: 0
        }
      ]))
    } as any;

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 250, durationHours: 4 },
      repository: mockRepo,
      needs: new Map([
        ['BATHROOM', {
          serviceNodeId: 'node-bath',
          nodeCode: 'BATHROOM',
          nodeName: 'Baño Portátil',
          quantityInferred: 1,
          isEssential: true,
          reasoning: ['Base'],
          confidenceScore: 1.0
        }]
      ])
    };

    await stage.execute(context);
    // ceil(250/100) = 3 bathrooms
    expect(context.needs.get('BATHROOM')?.quantityInferred).toBe(3);
  });

  it('should respect "maxQuantity" constraint', async () => {
    const stage = new QuantityScalingStage();
    
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findScalingRulesByNodeId: vi.fn().mockResolvedValue(ok([
        {
          nodeId: 'node-staff',
          ruleType: 'STAIRCASE',
          parameterTarget: 'ATTENDEES',
          baseQuantity: 1,
          divisor: 100,
          maxQuantity: 2 
        }
      ]))
    } as any;

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 500, durationHours: 4 },
      repository: mockRepo,
      needs: new Map([
        ['MANAGER', {
          serviceNodeId: 'node-staff',
          nodeCode: 'MANAGER',
          nodeName: 'Project Manager',
          quantityInferred: 1,
          isEssential: true,
          reasoning: ['Base'],
          confidenceScore: 1.0
        }]
      ])
    };

    await stage.execute(context);
    // ceil(500/100) = 5, but max is 2
    expect(context.needs.get('MANAGER')?.quantityInferred).toBe(2);
  });

  it('should support "DURATION" parameter target', async () => {
    const stage = new QuantityScalingStage();
    
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findScalingRulesByNodeId: vi.fn().mockResolvedValue(ok([
        {
          nodeId: 'node-service',
          ruleType: 'LINEAR',
          parameterTarget: 'DURATION',
          baseQuantity: 1,
          divisor: 1,
          maxQuantity: 0
        }
      ]))
    } as any;

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 100, durationHours: 8 },
      repository: mockRepo,
      needs: new Map([
        ['CLEANING', {
          serviceNodeId: 'node-service',
          nodeCode: 'CLEANING',
          nodeName: 'Limpieza',
          quantityInferred: 1,
          isEssential: false,
          reasoning: ['Base'],
          confidenceScore: 1.0
        }]
      ])
    };

    await stage.execute(context);
    expect(context.needs.get('CLEANING')?.quantityInferred).toBe(8);
  });
});
