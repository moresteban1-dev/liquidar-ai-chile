import { DependencyResolutionStage } from '@/core/domain/event-intelligence/engine/stages/DependencyResolutionStage';
import { InferenceContext } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { IKnowledgeRepository } from '@/core/application/ports/IKnowledgeRepository';
import { ok } from '@/core/shared/Result';
import { describe, it, expect, vi } from 'vitest';

describe('DependencyResolutionStage', () => {
  it('should resolve "REQUIRED" dependencies and add them to needs', async () => {
    const stage = new DependencyResolutionStage();
    
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findDependenciesByParentId: vi.fn(),
      findServiceNodeById: vi.fn(),
    } as any;

    // source-001 depends on target-001
    vi.mocked(mockRepo.findDependenciesByParentId).mockImplementation(async (parentId) => {
      if (parentId === 'source-001') {
        return ok([{
          parentId: 'source-001',
          childId: 'target-001',
          dependencyType: 'REQUIRED',
          minQuantity: 1
        }]);
      }
      return ok([]);
    });

    vi.mocked(mockRepo.findServiceNodeById).mockImplementation(async (id) => {
      if (id === 'target-001') {
        return ok({
          id: 'target-001',
          code: 'POWER_GEN',
          name: 'Generador Eléctrico',
          nodeType: 'EQUIPMENT',
          isEssential: false,
        } as any);
      }
      return ok(null);
    });

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 500, durationHours: 2 },
      repository: mockRepo,
      needs: new Map([
        ['PA_SYSTEM', {
          serviceNodeId: 'source-001',
          nodeCode: 'PA_SYSTEM',
          nodeName: 'Sistema de Sonido',
          quantityInferred: 1,
          isEssential: true,
          reasoning: ['Base requirement'],
          confidenceScore: 1.0
        }]
      ])
    };

    await stage.execute(context);

    // Assertions
    const powerNeed = context.needs.get('POWER_GEN');
    expect(powerNeed).toBeDefined();
    expect(powerNeed?.isEssential).toBe(true); // REQUIRED translates to isEssential: true
    expect(powerNeed?.reasoning[0]).toContain('Dependency of source-001');
  });

  it('should update reasoning if dependency target already exists in needs', async () => {
    const stage = new DependencyResolutionStage();
    
    const mockRepo: vi.Mocked<IKnowledgeRepository> = {
      findDependenciesByParentId: vi.fn().mockImplementation(async (parentId) => {
        if (parentId === 'source-001') {
          return ok([{
            parentId: 'source-001',
            childId: 'target-001',
            dependencyType: 'OPTIONAL',
            minQuantity: 1
          }]);
        }
        return ok([]);
      }),
      findServiceNodeById: vi.fn()
    } as any;

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 100, durationHours: 1 },
      repository: mockRepo,
      needs: new Map([
        ['VIP_LOUNGE', {
          serviceNodeId: 'source-001',
          nodeCode: 'VIP_LOUNGE',
          nodeName: 'Sala VIP',
          quantityInferred: 1,
          isEssential: true,
          reasoning: ['Base'],
          confidenceScore: 1.0
        }],
        ['STAFF_SECURITY', {
          serviceNodeId: 'target-001',
          nodeCode: 'STAFF_SECURITY',
          nodeName: 'Seguridad',
          quantityInferred: 1,
          isEssential: false,
          reasoning: ['Existing base'],
          confidenceScore: 0.5
        }]
      ])
    };

    await stage.execute(context);

    const securityNeed = context.needs.get('STAFF_SECURITY');
    expect(securityNeed?.reasoning.length).toBe(2);
    expect(securityNeed?.reasoning[1]).toContain('Also required/recommended by source-001');
  });
});
