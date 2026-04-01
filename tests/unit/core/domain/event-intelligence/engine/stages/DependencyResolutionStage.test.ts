import { DependencyResolutionStage } from '@/core/domain/event-intelligence/engine/stages/DependencyResolutionStage';
import { InferenceContext } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { EventTypeGraph, ServiceNode } from '@/core/domain/event-intelligence/types';

describe('DependencyResolutionStage', () => {
  it('should resolve "REQUIRES" dependencies and add them to needs', () => {
    const stage = new DependencyResolutionStage();
    
    const targetNode: ServiceNode = {
      id: 'target-001',
      code: 'POWER_GEN',
      name: 'Generador Eléctrico',
      nodeType: 'EQUIPMENT',
      isEssential: false,
      dependencies: [],
      scalingRules: []
    };

    const sourceNode: ServiceNode = {
      id: 'source-001',
      code: 'PA_SYSTEM',
      name: 'Sistema de Sonido',
      nodeType: 'EQUIPMENT',
      isEssential: true,
      dependencies: [
        {
          sourceNodeId: 'source-001',
          targetNodeId: 'target-001',
          type: 'REQUIRES',
          reasoning: 'El sistema de sonido requiere energía independiente.',
          confidenceScore: 0.95
        }
      ],
      scalingRules: []
    };

    const mockGraph: EventTypeGraph = {
      id: 'evt-1',
      code: 'CONCERT',
      name: 'Concierto',
      baseNodes: [
        { priority: 1, node: sourceNode },
        { priority: 0, node: targetNode }
      ]
    };

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 500, durationHours: 2 },
      graph: mockGraph,
      needs: new Map([
        ['PA_SYSTEM', {
          serviceNodeId: 'source-001',
          nodeCode: 'PA_SYSTEM',
          nodeName: 'Sistema de Sonido',
          quantityInferred: 1,
          isEssential: true,
          reasoning: ['Nodo base'],
          confidenceScore: 1.0
        }]
      ])
    };

    stage.execute(context);

    // Assertions
    // En V1, el generador se agrega con un código auto-generado 'EXT_target-0'
    const powerNeedKey = Array.from(context.needs.keys()).find(k => k.startsWith('EXT_target-0'));
    expect(powerNeedKey).toBeDefined();

    const powerNeed = context.needs.get(powerNeedKey!);
    expect(powerNeed?.isEssential).toBe(true); // REQUIRES translates to isEssential: true
    expect(powerNeed?.confidenceScore).toBe(0.95); // 0.95 * 1.0
    expect(powerNeed?.reasoning[0]).toContain('REQUIRES por Sistema de Sonido');
  });

  it('should update reasoning and confidence score if dependency target already exists in needs', () => {
    const stage = new DependencyResolutionStage();
    
    const dependencyTarget: ServiceNode = {
      id: 'target-001',
      code: 'STAFF_SECURITY',
      name: 'Seguridad',
      nodeType: 'STAFF',
      isEssential: false,
      dependencies: [],
      scalingRules: []
    };

    const sourceNode: ServiceNode = {
      id: 'source-001',
      code: 'VIP_LOUNGE',
      name: 'Sala VIP',
      nodeType: 'SERVICE',
      isEssential: true,
      dependencies: [
        {
          sourceNodeId: 'source-001',
          targetNodeId: 'target-001',
          type: 'RECOMMENDS',
          reasoning: 'Recomendado para control de acceso VIP.',
          confidenceScore: 0.8
        }
      ],
      scalingRules: []
    };

    const mockGraph: EventTypeGraph = {
      id: 'evt-1',
      code: 'EVENT',
      name: 'Generic Event',
      baseNodes: [
        { priority: 1, node: sourceNode },
        { priority: 0, node: dependencyTarget }
      ]
    };

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 100, durationHours: 1 },
      graph: mockGraph,
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
          reasoning: ['Base'],
          confidenceScore: 0.5
        }]
      ])
    };

    stage.execute(context);

    const securityNeed = context.needs.get('STAFF_SECURITY');
    expect(securityNeed?.reasoning.length).toBe(2);
    expect(securityNeed?.reasoning[1]).toContain('RECOMMENDS por Sala VIP');
    // Score update: 0.5 + (0.8 * 0.1) = 0.58
    expect(securityNeed?.confidenceScore).toBeCloseTo(0.58);
  });
});
