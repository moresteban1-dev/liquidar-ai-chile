import { InferenceEngine } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { KnowledgeGraphRepository } from '@/core/domain/event-intelligence/KnowledgeGraphRepository';
import { EventProfile, EventTypeGraph } from '@/core/domain/event-intelligence/types';

describe('InferenceEngine', () => {
  it('should run the complete pipeline and return sorted results', async () => {
    // 1. Setup Mock Repository
    const mockRepo: KnowledgeGraphRepository = {
      getGraphForEventType: vi.fn(),
      saveConfigurationSession: vi.fn(),
      getConfigurationSession: vi.fn()
    };

    const engine = new InferenceEngine(mockRepo);

    // 2. Setup Mock Graph
    const mockGraph: EventTypeGraph = {
      id: 'evt-type-123',
      code: 'WEDDING',
      name: 'Boda',
      baseNodes: [
        {
          priority: 1,
          node: {
            id: 'node-main',
            code: 'MAIN_SERVICE',
            name: 'Servicio Principal',
            nodeType: 'SERVICE',
            isEssential: true,
            dependencies: [
              {
                sourceNodeId: 'node-main',
                targetNodeId: 'node-dep',
                type: 'REQUIRES',
                reasoning: 'Dependencia obligatoria',
                confidenceScore: 1.0
              }
            ],
            scalingRules: [
              {
                serviceNodeId: 'node-main',
                ruleType: 'LINEAR',
                parameterTarget: 'ATTENDEES',
                baseQuantity: 1,
                divisor: 1,
                maxQuantity: null
              }
            ]
          }
        },
        {
          priority: 0, // No es base, es dependencia
          node: {
            id: 'node-dep',
            code: 'DEP_SERVICE',
            name: 'Servicio Dependiente',
            nodeType: 'EQUIPMENT',
            isEssential: false,
            dependencies: [],
            scalingRules: [
              {
                serviceNodeId: 'node-dep',
                ruleType: 'STEP',
                parameterTarget: 'ATTENDEES',
                baseQuantity: 1,
                divisor: 100,
                maxQuantity: null
              }
            ]
          }
        }
      ]
    };

    vi.mocked(mockRepo.getGraphForEventType).mockResolvedValue(mockGraph);

    // 3. Run Inference
    const profile: EventProfile = {
      eventTypeId: 'evt-type-123',
      attendees: 250,
      durationHours: 6
    };

    const results = await engine.runInference(profile);

    // 4. Assertions
    expect(results).toHaveLength(2);
    
    // Check Main Service (Linear: 250 * 1 = 250)
    const main = results.find(r => r.nodeCode === 'MAIN_SERVICE');
    expect(main).toBeDefined();
    expect(main?.quantityInferred).toBe(250);
    expect(main?.isEssential).toBe(true);
    
    // Check Dependent Service (Step: ceil(250/100) * 1 = 3)
    // Note: V1 uses auto-generated code for external dependencies if not already in needs
    const dep = results.find(r => r.nodeCode.includes('DEP_SERVICE') || r.nodeCode.startsWith('EXT_node-dep'));
    expect(dep).toBeDefined();
    expect(dep?.quantityInferred).toBe(3);
    expect(dep?.isEssential).toBe(true); // Because type was REQUIRES

    // Check Sorting (Both are essential, both have score 1.0)
    expect(results[0]).toBeDefined();
    expect(results[1]).toBeDefined();
  });

  it('should throw error if graph is not found', async () => {
    const mockRepo: KnowledgeGraphRepository = {
      getGraphForEventType: vi.fn().mockResolvedValue(null),
      saveConfigurationSession: vi.fn(),
      getConfigurationSession: vi.fn()
    };

    const engine = new InferenceEngine(mockRepo);
    
    await expect(engine.runInference({ eventTypeId: 'invalid', attendees: 1, durationHours: 1 }))
      .rejects.toThrow('Knowledge Graph');
  });
});
