import { PricingInputSchema, PricingOutputSchema } from './types';
import { Logger } from '@app/ports/Logger';
import { AIGenerator } from '@app/ports/AIGenerator';
import { AIAuditPort } from '@core/application/ports/AIAuditPort';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { z } from 'zod';

export class PricingOracleAgent {
    constructor(
        private logger: Logger,
        private aiGenerator: AIGenerator,
        private auditPort: AIAuditPort
    ) { }

    async execute(input: z.infer<typeof PricingInputSchema>): Promise<Result<z.infer<typeof PricingOutputSchema>, AppError>> {
        // Defensive Check: Ensure API key is present before calling SDK
        if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
            this.logger.warn('[PricingOracleAgent] OpenAI API Key missing. Skipping live prediction.');
            return fail(AppError.internal('OpenAI API Key is missing. Live prediction disabled.'));
        }

        const { historicalCosts, historicalPrices, complexity, marketTrends } = input;

        const avgCost = historicalCosts.length > 0 
            ? historicalCosts.reduce((a, b) => a + b, 0) / historicalCosts.length 
            : 0;
            
        const avgPrice = historicalPrices.length > 0 
            ? historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length 
            : 0;

        const prompt = `
          Eres el "Pricing Oracle" de una plataforma de Dropservice.
          Tu objetivo es predecir el precio y costo óptimo basado en datos históricos y tendencias.

          DATOS HISTÓRICOS:
          - Costo Promedio: ${avgCost}
          - Precio de Venta Promedio: ${avgPrice}
          - Complejidad: ${complexity}
          - Tendencias del Mercado: ${marketTrends || 'Estables'}

          REGLAS:
          1. Sugiere un suggestedCost basado en el promedio y la complejidad.
          2. Sugiere un suggestedPrice que mantenga un margen saludable (15-30%).
          3. Evalúa isSecure: true solo si el precio sugerido no se desvía más de un 10-15% del histórico.
        `;

        try {
            const { object } = await this.aiGenerator.generateObject({
                model: 'gpt-4o-mini',
                schema: PricingOutputSchema,
                prompt: prompt,
            });

            await this.auditPort.log({
                agentName: 'PricingOracle',
                agentVersion: 'v1.0',
                action: 'PRICE_PREDICTION',
                decision: object.isSecure ? 'approved' : 'suggested',
                autonomyLevel: object.isSecure ? 'full_auto' : 'suggest',
                confidence: object.confidence,
                reasoning: object.reasoning,
                aggregateType: 'QUOTATION',
                aggregateId: input.serviceId || 'unknown',
                modelUsed: 'gpt-4o-mini',
                metadata: { suggestedPrice: object.suggestedPrice, margin: object.margin }
            });

            return ok(object);
        } catch (error) {
            this.logger.error('[PricingOracleAgent] Prediction Failed', error);
            return fail(AppError.internal(`Pricing prediction failed: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
}
