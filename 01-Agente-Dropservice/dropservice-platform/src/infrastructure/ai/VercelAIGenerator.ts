import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { AIGenerator } from '@app/ports/AIGenerator';

export class VercelAIGenerator implements AIGenerator {
    async generateObject<T>(params: {
        model: string;
        schema: z.ZodType<T>;
        prompt: string;
        system?: string;
    }): Promise<{ object: T }> {
        // Map model string to actual provider
        // For now hardcoding to gpt-4o-mini as requested by the original code
        return await generateObject({
            model: openai('gpt-4o-mini'),
            schema: params.schema,
            prompt: params.prompt,
            system: params.system,
        });
    }
}
