import { BaseMappingStage } from '@/core/domain/event-intelligence/engine/stages/BaseMappingStage';
import { InferenceContext } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { EventTypeGraph, EventProfile } from '@/core/domain/event-intelligence/types';

describe('BaseMappingStage', () => {
  it('should map base nodes from graph to needs context', () => {
    const stage = new BaseMappingStage();
    
    const mockGraph: EventTypeGraph = {
      id: 'evt-type-1',
      code: 'CORPORATE_EVENT',
      name: 'Evento Corporativo',
      baseNodes: [
        {
          priority: 1,
          node: {
            id: 'node-1',
            code: 'PA_SYSTEM',
            name: 'Sistema de Sonido',
            nodeType: 'EQUIPMENT',
            isEssential: true,
            dependencies: [],
            scalingRules: []
          }
        },
        {
          priority: 2,
          node: {
            id: 'node-2',
            code: 'COFFEE_BREAK',
            name: 'Servicio de Café',
            nodeType: 'SERVICE',
            isEssential: false,
            dependencies: [],
            scalingRules: []
          }
        }
      ]
    };

    const mockProfile: EventProfile = {
      eventTypeId: 'evt-type-1',
      attendees: 50,
      durationHours: 4
    };

    const context: InferenceContext = {
      profile: mockProfile,
      graph: mockGraph,
      needs: new Map()
    };

    stage.execute(context);

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
    expect(coffeeNeed?.reasoning[0]).toContain('Prioridad 2');
  });

  it('should mark node as essential if priority is 1 even if node metadata says otherwise', () => {
    const stage = new BaseMappingStage();
    const mockGraph: EventTypeGraph = {
      id: 'evt-type-1',
      code: 'TEST',
      name: 'Test Event',
      baseNodes: [
        {
          priority: 1,
          node: {
            id: 'node-3',
            code: 'NON_ESSENTIAL_NODE',
            name: 'Optional but Priority 1',
            nodeType: 'SERVICE',
            isEssential: false, // Metadata says false
            dependencies: [],
            scalingRules: []
          }
        }
      ]
    };

    const context: InferenceContext = {
      profile: { eventTypeId: '1', attendees: 1, durationHours: 1 },
      graph: mockGraph,
      needs: new Map()
    };

    stage.execute(context);

    expect(context.needs.get('NON_ESSENTIAL_NODE')?.isEssential).toBe(true);
  });
});
