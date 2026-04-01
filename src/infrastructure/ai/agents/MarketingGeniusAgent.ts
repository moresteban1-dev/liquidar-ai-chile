import { MarketingInputSchema, MarketingOutputSchema } from './types';
import { Logger } from '@app/ports/Logger';
import { AIGenerator } from '@app/ports/AIGenerator';
import { AIAuditPort } from '@core/application/ports/AIAuditPort';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { z } from 'zod';

export class MarketingGeniusAgent {
    constructor(
        private logger: Logger,
        private aiGenerator: AIGenerator,
        private auditPort: AIAuditPort
    ) { }

    async execute(input: z.infer<typeof MarketingInputSchema>): Promise<Result<z.infer<typeof MarketingOutputSchema>, AppError>> {
        const { serviceName, categoryName, description, targetAudience } = input;

        // Note: For now we'll use a direct prompt, but eventually this should be in PromptRegistry
        const prompt = `
          Eres un experto en Marketing Digital y SEO para plataformas de "Dropservice".
          Tu objetivo es generar contenido persuasivo y optimizado para el siguiente servicio:

          SERVICIO: ${serviceName}
          CATEGORÍA: ${categoryName}
          DESCRIPCIÓN BASE: ${description || 'N/A'}
          PÚBLICO OBJETIVO: ${targetAudience || 'General'}

          REGLAS:
          1. Genera un seoTitle llamativo (< 60 caracteres).
          2. Genera una metaDescription que incite al clic (< 160 caracteres).
          3. El persuasiveCopy debe resaltar beneficios, no solo características.
          4. Enumera al menos 4 features clave.
        `;

        try {
            const { object } = await this.aiGenerator.generateObject({
                model: 'gpt-4o-mini',
                schema: MarketingOutputSchema,
                prompt: prompt,
            });

            await this.auditPort.log({
                agentName: 'MarketingGenius',
                agentVersion: 'v1.0',
                action: 'CONTENT_GENERATION',
                decision: 'suggested',
                autonomyLevel: 'suggest', // Per recommendation: Approval first
                confidence: object.confidence,
                reasoning: object.reasoning,
                aggregateType: 'SERVICE',
                aggregateId: serviceName, // Fallback if no ID yet
                modelUsed: 'gpt-4o-mini',
                metadata: { seoTitle: object.seoTitle }
            });

            return ok(object);
        } catch (error) {
            this.logger.error('[MarketingGeniusAgent] Generation Failed', error);
            return fail(AppError.internal(`Marketing generation failed: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
}
