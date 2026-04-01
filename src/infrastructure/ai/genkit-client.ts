import { genkit } from 'genkit';
import { googleAI, gemini15Flash, gemini15Pro, textEmbedding004 } from '@genkit-ai/googleai';

export const ai = genkit({
    plugins: [googleAI()],
    model: gemini15Flash,  // Default: Economic & Fast
});

/**
 * Available AI Models for different use cases.
 * Usage: ai.generate({ model: AI_MODELS.powerful, ... })
 */
export const AI_MODELS = {
    fast: gemini15Flash,     // High speed, lower cost (e.g. simple classification, extraction)
    powerful: gemini15Pro,   // High reasoning, higher cost (e.g. complex planning, creative writing)
    embedding: textEmbedding004, // For vector search & semantic cache
} as const;
