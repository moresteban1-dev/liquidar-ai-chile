import { z } from 'zod';

export interface AIGenerator {
    generateObject<T>(params: {
        model: string;
        schema: z.ZodType<T>;
        prompt: string;
        system?: string;
    }): Promise<{ object: T }>;
}
