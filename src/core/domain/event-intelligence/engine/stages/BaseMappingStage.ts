import { InferenceStage } from './InferenceStage';
import { InferenceContext } from '../InferenceEngine';
import { Result, ok } from '@/core/shared/Result';

export class BaseMappingStage implements InferenceStage {
  async execute(context: InferenceContext): Promise<Result<void, Error>> {
    const { profile, repository, needs } = context;

    // 1. Fetch baseline nodes for the event type
    const baselineResult = await repository.findBaselineNodesByEventType(profile.eventTypeId);
    if (baselineResult.isFailure()) return baselineResult;
    const baselineNodes = baselineResult.getValue();

    // 2. Add them to the needs map
    for (const item of baselineNodes) {
      needs.set(item.nodeCode, {
        serviceNodeId: item.nodeId,
        nodeCode: item.nodeCode,
        nodeName: item.nodeName,
        quantityInferred: 1, 
        isEssential: item.priority === 1,
        reasoning: [`Baseline requirement for event type: ${profile.eventTypeId}`],
        confidenceScore: 1.0
      });
    }

    // 3. Add essential nodes that are global
    const essentialResult = await repository.findEssentialNodes();
    if (essentialResult.isFailure()) return essentialResult;
    const essentialNodes = essentialResult.getValue();

    for (const node of essentialNodes) {
      if (!needs.has(node.code)) {
        needs.set(node.code, {
          serviceNodeId: node.id,
          nodeCode: node.code,
          nodeName: node.name,
          quantityInferred: 1,
          isEssential: true,
          reasoning: ['Global essential service definition'],
          confidenceScore: 1.0
        });
      }
    }

    return ok(undefined);
  }
}
