import { z } from 'genkit';
import { executeAIFlow } from '../services/ResilientGenkitService';
import { Result } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

const biasAnalysisOutputSchema = z.object({
    overallBiasScore: z.number().min(0).max(100),
    biasesDetected: z.array(z.object({
        type: z.string(),
        name: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        description: z.string(),
        textEvidence: z.string(),
        debiasingSuggestion: z.string(),
        confidence: z.number().min(0).max(1),
    })),
    summary: z.string(),
    objectivityScore: z.number().min(0).max(100),
    recommendations: z.array(z.string()),
});

export type BiasAnalysisOutput = z.infer<typeof biasAnalysisOutputSchema>;

import { PromptRegistry } from '@core/ai/prompts/PromptRegistry';

export async function analyzeBias(
    content: string,
    options: { depth: 'quick' | 'standard' | 'deep'; language: string }
): Promise<Result<BiasAnalysisOutput, AppError>> {

    const prompt = PromptRegistry.get('BIAS_ANALYSIS', 'v1')({
        depth: options.depth,
        language: options.language,
        content
    });

    return executeAIFlow({
        name: 'bias-analysis',
        input: { content, options },
        outputSchema: biasAnalysisOutputSchema,
        prompt,
        complexity: options.depth === 'deep' ? 'complex' : 'moderate',
        model: options.depth === 'deep' ? 'powerful' : 'fast',
        temperature: 0.2, // Low temperature for high objectivity
        timeoutMs: options.depth === 'deep' ? 60_000 : 30_000,
    });
}
