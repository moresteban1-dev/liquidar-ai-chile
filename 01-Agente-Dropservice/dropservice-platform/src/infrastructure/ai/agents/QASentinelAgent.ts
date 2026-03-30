import { QAInputSchema, QAOutputSchema } from './types';
import { PromptRegistry } from '@core/ai/prompts/PromptRegistry';
import { Logger } from '@app/ports/Logger';
import { AIGenerator } from '@app/ports/AIGenerator';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { z } from 'zod';

import { AIAuditPort } from '@core/application/ports/AIAuditPort';

export class QASentinelAgent {
    constructor(
        private logger: Logger,
        private aiGenerator: AIGenerator,
        private auditPort: AIAuditPort
    ) { }

    async execute(input: z.infer<typeof QAInputSchema>): Promise<Result<z.infer<typeof QAOutputSchema>, AppError>> {
        const { briefContent, deliverableContent, deliverableType } = input;

        const promptTemplate = PromptRegistry.get('QA_REVIEW', 'v1');
        const prompt = promptTemplate({
            briefContent,
            deliverableType: deliverableType || "TEXT",
            deliverableContent
        });

        try {
            const { object } = await this.aiGenerator.generateObject({
                model: 'gpt-4o-mini',
                schema: QAOutputSchema,
                prompt: prompt,
            });

            await this.auditPort.log({
                agentName: 'QASentinelAgent',
                agentVersion: 'v1.1',
                action: 'QA_REVIEW',
                decision: object.status === 'PASS' ? 'approved' : 'rejected',
                autonomyLevel: object.autonomyLevel,
                confidence: object.confidence,
                reasoning: object.feedback,
                aggregateType: 'QUOTATION',
                aggregateId: 'internal-qa', // Should be passed in input later
                modelUsed: 'gpt-4o-mini',
                metadata: { score: object.score, issues: object.issues }
            });

            return ok(object);
        } catch (error) {
            this.logger.error('[QASentinelAgent] Review Failed', error);

            // Log failure as well
            await this.auditPort.log({
                agentName: 'QASentinelAgent',
                agentVersion: 'v1.1-error',
                action: 'QA_REVIEW_FAILED',
                decision: 'rejected',
                autonomyLevel: 'human_only',
                confidence: 0,
                reasoning: `Analysis failed: ${String(error)}`,
                aggregateType: 'QUOTATION',
                aggregateId: 'internal-qa-error',
                metadata: { error: String(error) }
            }).catch(() => { /* mute audit failure on error path */ });

            return fail(AppError.internal(`QA Analysis failed: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
}

// ─── Container-backed singleton accessor ──────────────────────
// Prefer using `container.resolve(DI_KEYS.QASentinelAgent)` directly.
// This export remains for backward compatibility with existing call sites.

import { container, DI_KEYS } from '@infrastructure/di/Container';

export const qaSentinelAgent = {
    async execute(input: z.infer<typeof QAInputSchema>) {
        const agent = await container.resolve<QASentinelAgent>(DI_KEYS.QASentinelAgent);
        return agent.execute(input);
    }
};
