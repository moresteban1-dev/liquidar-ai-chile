import { QuantityScalingStage } from '@/core/domain/event-intelligence/engine/stages/QuantityScalingStage';
import { InferenceContext } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { EventTypeGraph, ServiceNode } from '@/core/domain/event-intelligence/types';

describe('QuantityScalingStage', () => {
  it('should apply "LINEAR" scaling rules (e.g. 1 chair per attendee)', () => {
    const stage = new QuantityScalingStage();
    
    const node: ServiceNode = {
      id: 'node-chair',
      code: 'CHAIR',
      name: 'Silla',
      nodeType: 'EQUIPMENT',
      isEssential: true,
      dependencies: [],
      scalingRules: [
        {
          serviceNodeId: 'node-chair',
          ruleType: 'LINEAR',
          parameterTarget: 'ATTENDEES',
          baseQuantity: 1,
          divisor: 1,
          maxQuantity: null
        }
      ]
    };

    const mockGraph: EventTypeGraph = {
      id: 'evt-1',
      code: 'EVENT',
      name: 'Test',
      baseNodes: [{ priority: 1, node }]
    };

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 150, durationHours: 4 },
      graph: mockGraph,
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

    stage.execute(context);

    expect(context.needs.get('CHAIR')?.quantityInferred).toBe(150);
    expect(context.needs.get('CHAIR')?.reasoning.length).toBe(2);
  });

  it('should apply "STEP" scaling rules (e.g. 1 bathroom per 100 attendees)', () => {
    const stage = new QuantityScalingStage();
    
    const node: ServiceNode = {
      id: 'node-bath',
      code: 'BATHROOM',
      name: 'Baño Portátil',
      nodeType: 'EQUIPMENT',
      isEssential: true,
      dependencies: [],
      scalingRules: [
        {
          serviceNodeId: 'node-bath',
          ruleType: 'STEP',
          parameterTarget: 'ATTENDEES',
          baseQuantity: 1,
          divisor: 100,
          maxQuantity: null
        }
      ]
    };

    const mockGraph: EventTypeGraph = {
      id: 'evt-1',
      code: 'EVENT',
      name: 'Test',
      baseNodes: [{ priority: 1, node }]
    };

    const context1: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 250, durationHours: 4 },
      graph: mockGraph,
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

    stage.execute(context1);
    // ceil(250/100) = 3 bathrooms
    expect(context1.needs.get('BATHROOM')?.quantityInferred).toBe(3);

    const context2: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 100, durationHours: 4 },
      graph: mockGraph,
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

    stage.execute(context2);
    // ceil(100/100) = 1 bathroom
    expect(context2.needs.get('BATHROOM')?.quantityInferred).toBe(1);
  });

  it('should respect "maxQuantity" constraint', () => {
    const stage = new QuantityScalingStage();
    
    const node: ServiceNode = {
      id: 'node-staff',
      code: 'MANAGER',
      name: 'Project Manager',
      nodeType: 'STAFF',
      isEssential: true,
      dependencies: [],
      scalingRules: [
        {
          serviceNodeId: 'node-staff',
          ruleType: 'STEP',
          parameterTarget: 'ATTENDEES',
          baseQuantity: 1,
          divisor: 100,
          maxQuantity: 2 // Max 2 managers no matter what
        }
      ]
    };

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 500, durationHours: 4 },
      graph: { id: 'evt-1', code: 'T', name: 'T', baseNodes: [{ priority: 1, node }] },
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

    stage.execute(context);
    // ceil(500/100) = 5, but max is 2
    expect(context.needs.get('MANAGER')?.quantityInferred).toBe(2);
    expect(context.needs.get('MANAGER')?.reasoning[1]).toContain('Tope MÁX alcanzado: 2');
  });

  it('should support "HOURS" parameter target', () => {
    const stage = new QuantityScalingStage();
    
    const node: ServiceNode = {
      id: 'node-service',
      code: 'CLEANING',
      name: 'Limpieza',
      nodeType: 'SERVICE',
      isEssential: false,
      dependencies: [],
      scalingRules: [
        {
          serviceNodeId: 'node-service',
          ruleType: 'LINEAR',
          parameterTarget: 'HOURS',
          baseQuantity: 1,
          divisor: 1,
          maxQuantity: null
        }
      ]
    };

    const context: InferenceContext = {
      profile: { eventTypeId: 'evt-1', attendees: 100, durationHours: 8 },
      graph: { id: 'evt-1', code: 'T', name: 'T', baseNodes: [{ priority: 1, node }] },
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

    stage.execute(context);
    expect(context.needs.get('CLEANING')?.quantityInferred).toBe(8);
  });
});
