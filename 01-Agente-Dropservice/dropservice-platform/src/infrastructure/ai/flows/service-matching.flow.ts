import { z } from 'genkit';
import { executeAIFlow } from '../services/ResilientGenkitService';
import { Result } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { PromptRegistry } from '@core/ai/prompts/PromptRegistry';

const serviceMatchOutputSchema = z.object({
    matches: z.array(z.object({
        requestedItemId: z.string().optional(),
        catalogItemId: z.string().optional(),
        confidence: z.number().min(0).max(1),
        reasoning: z.string(),
        providerProposal: z.object({
            concept: z.string(),
            category: z.enum(['SERVICIO', 'LOGISTICA']),
            quantity: z.number(),
            unitPriceNet: z.number(),
            totalPriceNet: z.number()
        }),
        clientProposal: z.object({
            description: z.string(),
            quantity: z.number(),
            unitPriceNet: z.number(),
            totalPriceNet: z.number()
        })
    })),
    summary: z.string()
});

export type ServiceMatchOutput = z.infer<typeof serviceMatchOutputSchema>;

export async function matchServicesWithCatalog(
    brief: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestedItems: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catalogContext: any[]
): Promise<Result<ServiceMatchOutput, AppError>> {

    const prompt = PromptRegistry.get('CATALOG_MATCHING', 'v1')({
        profile: { brief } as any,
        requestedItems,
        catalog: catalogContext
    });

    return executeAIFlow({
        name: 'service-matching',
        input: { brief, requestedItems, catalogContext },
        outputSchema: serviceMatchOutputSchema,
        prompt,
        complexity: 'moderate',
        model: 'fast', // Gemini Flash is enough for matching
        temperature: 0.1, // High precision
        timeoutMs: 45_000,
    });
}
