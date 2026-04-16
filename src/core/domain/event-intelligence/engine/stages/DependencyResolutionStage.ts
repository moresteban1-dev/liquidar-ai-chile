import { InferenceStage, InferenceContext } from '../InferenceTypes';
import { Result, ok } from '@/core/shared/Result';

export class DependencyResolutionStage implements InferenceStage {
  async execute(context: InferenceContext): Promise<Result<void, Error>> {
    const { repository, needs } = context;

    // BFS Queue initialization with current needs
    const queue: string[] = Array.from(needs.values()).map(n => n.serviceNodeId);
    const visited = new Set<string>(queue);

    while (queue.length > 0) {
      const parentId = queue.shift()!;
      
      // Fetch dependencies for this node
      const depResult = await repository.findDependenciesByParentId(parentId);
      if (depResult.isFailure()) return depResult;
      const dependencies = depResult.getValue();

      for (const dep of dependencies) {
        // If already in needs, just update reasoning/essentiality
        let currentNeed = Array.from(needs.values()).find(n => n.serviceNodeId === dep.childId);

        if (!currentNeed) {
          // Fetch full node details to create the need
          const nodeResult = await repository.findServiceNodeById(dep.childId);
          if (nodeResult.isFailure()) return nodeResult;
          const childNode = nodeResult.getValue();
          
          if (!childNode) continue;

          currentNeed = {
            serviceNodeId: childNode.id,
            nodeCode: childNode.code,
            nodeName: childNode.name,
            quantityInferred: dep.minQuantity || 1,
            isEssential: dep.dependencyType === 'REQUIRED',
            reasoning: [`Dependency of ${parentId} (${dep.dependencyType})`],
            confidenceScore: 1.0 // Simple score for now
          };
          needs.set(childNode.code, currentNeed);

          // Add to queue for further exploration if it's a new node
          if (!visited.has(dep.childId)) {
            visited.add(dep.childId);
            queue.push(dep.childId);
          }
        } else {
          // Already exists, update properties
          currentNeed.reasoning.push(`Also required/recommended by ${parentId}`);
          if (dep.dependencyType === 'REQUIRED') {
            currentNeed.isEssential = true;
          }
        }
      }
    }

    return ok(undefined);
  }
}
