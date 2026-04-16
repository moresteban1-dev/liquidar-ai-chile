import { InferenceStage, InferenceContext } from '../InferenceTypes';
import { Result, ok } from '@/core/shared/Result';

export class QuantityScalingStage implements InferenceStage {
  async execute(context: InferenceContext): Promise<Result<void, Error>> {
    const { profile, repository, needs } = context;

    for (const need of needs.values()) {
      const rulesResult = await repository.findScalingRulesByNodeId(need.serviceNodeId);
      if (rulesResult.isFailure()) return rulesResult;
      const rules = rulesResult.getValue();

      if (rules.length === 0) {
        // Fallback: Default to 1 if no rules defined
        need.quantityInferred = 1;
        continue;
      }

      // V1: Apply the first scaling result found (or max if multiple)
      for (const rule of rules) {
        let inputParameter = 1;

        if (rule.parameterTarget === 'ATTENDEES') inputParameter = profile.attendees;
        if (rule.parameterTarget === 'DURATION') inputParameter = profile.durationHours;

        let calculatedQty = rule.baseQuantity;

        if (rule.ruleType === 'LINEAR' || rule.ruleType === 'STAIRCASE') {
          const divisor = rule.divisor || 1;
          calculatedQty = Math.ceil((inputParameter / divisor) * rule.baseQuantity);
        }

        // Cap Maximum
        if (rule.maxQuantity && calculatedQty > rule.maxQuantity) {
          calculatedQty = rule.maxQuantity;
        }

        // Use the highest quantity found among multiple rules for the same node
        need.quantityInferred = Math.max(need.quantityInferred || 0, calculatedQty);
        need.reasoning.push(`Scaled to ${calculatedQty} using ${rule.ruleType} rule (target: ${rule.parameterTarget})`);
      }
    }

    return ok(undefined);
  }
}
