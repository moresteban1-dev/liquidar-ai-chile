import { NegotiatorInputSchema, NegotiatorOutputSchema } from './types';
import { PromptRegistry } from '@core/ai/prompts/PromptRegistry';
import { Logger } from '@app/ports/Logger';
import { AIGenerator } from '@app/ports/AIGenerator';
import { z } from 'zod';

import { AIAuditPort } from '@core/application/ports/AIAuditPort';

export class NegotiatorAgent {
    constructor(
        private logger: Logger,
        private aiGenerator: AIGenerator,
        private auditPort: AIAuditPort
    ) { }

    async execute(input: z.infer<typeof NegotiatorInputSchema>): Promise<z.infer<typeof NegotiatorOutputSchema>> {
        const { priceCost, serviceCategory } = input;

        const marketRate = priceCost * 0.9;
        const deviation = ((priceCost - marketRate) / marketRate) * 100;

        if (deviation <= 10) {
            const result = {
                decision: "APPROVE" as const,
                confidence: 1, // High confidence for hardcoded rule
                autonomyLevel: "full_auto" as const,
                reasoning: `Price ${priceCost} is within 10% of estimated market rate (${marketRate}).`,
                replyToUser: "Calculando márgenes... El precio está dentro del rango aceptable del mercado."
            };

            await this.auditPort.log({
                agentName: 'NegotiatorAgent',
                agentVersion: 'v1.1',
                action: 'PRICE_VALIDATION',
                decision: 'approved',
                autonomyLevel: 'full_auto',
                confidence: result.confidence,
                reasoning: result.reasoning,
                aggregateType: 'QUOTATION',
                aggregateId: input.priceCost.toString(), // Temporary fix until aggregateId is in input
                metadata: { priceCost, marketRate, deviation }
            });

            return result;
        }

        const promptTemplate = PromptRegistry.get('NEGOTIATOR_ANALYSIS', 'v1');
        const prompt = promptTemplate({
            serviceCategory,
            marketRate,
            priceCost,
            deviation: deviation.toFixed(1)
        });

        try {
            const { object } = await this.aiGenerator.generateObject({
                model: 'gpt-4o',
                schema: NegotiatorOutputSchema,
                prompt: prompt,
            });

            await this.auditPort.log({
                agentName: 'NegotiatorAgent',
                agentVersion: 'v1.1',
                action: 'LLM_NEGOTIATION',
                decision: object.decision.toLowerCase() as any,
                autonomyLevel: object.autonomyLevel,
                confidence: object.confidence,
                reasoning: object.reasoning,
                aggregateType: 'QUOTATION',
                aggregateId: input.priceCost.toString(),
                modelUsed: 'gpt-4o',
                metadata: { input }
            });

            return object;
        } catch (error) {
            this.logger.error('[NegotiatorAgent] Analysis Failed', error);
            const fallback = {
                decision: "NEGOTIATE" as const,
                confidence: 0.5,
                autonomyLevel: "suggest" as const,
                reasoning: "AI strategy generation failed, fallback applied.",
                suggestedCounterOffer: marketRate * 1.05,
                replyToUser: "El precio excede nuestro margen normal. Te sugiero ajustar la oferta."
            };

            await this.auditPort.log({
                agentName: 'NegotiatorAgent',
                agentVersion: 'v1.1-fallback',
                action: 'LLM_NEGOTIATION_FALLBACK',
                decision: 'suggested',
                autonomyLevel: 'suggest',
                confidence: 0.5,
                reasoning: 'Fallback due to LLM error',
                aggregateType: 'QUOTATION',
                aggregateId: input.priceCost.toString(),
                metadata: { error: String(error) }
            });

            return fallback;
        }
    }
}

// ─── Container-backed singleton accessor ──────────────────────
// Prefer using `container.resolve(DI_KEYS.NegotiatorAgent)` directly.
// This export remains for backward compatibility with existing call sites.

import { container, DI_KEYS } from '@infrastructure/di/Container';

export const negotiatorAgent = {
    async execute(input: z.infer<typeof NegotiatorInputSchema>) {
        const agent = await container.resolve<NegotiatorAgent>(DI_KEYS.NegotiatorAgent);
        return agent.execute(input);
    },
};
