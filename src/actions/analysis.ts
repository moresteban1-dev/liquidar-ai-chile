'use server';

import { createAction } from '@/lib/safe-action';
import { analyzeBias } from '@infrastructure/ai/flows/bias-analysis.flow';
import { revalidatePath } from 'next/cache';

import { analysisInputSchema } from '@/lib/validators';

export const runBiasAnalysis = createAction(
    {
        name: 'runBiasAnalysis',
        schema: analysisInputSchema,
        rateLimitKey: 'bias-analysis-action',
        rateLimitMax: 5, // 5 requests per minute
    },
    async (input) => {
        const result = await analyzeBias(input.content, input.options || { depth: 'standard', language: 'es' });

        if (!result.success) {
            throw result.error; // Will be caught by createAction wrapper
        }

        revalidatePath('/dashboard'); // Example path
        return result.data;
    }
);
