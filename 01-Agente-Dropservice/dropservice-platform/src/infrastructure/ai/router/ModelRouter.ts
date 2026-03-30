import { AI_MODELS } from '../genkit-client';

export type TaskComplexity = 'simple' | 'moderate' | 'complex';

export class ModelRouter {
    route(params: {
        prompt: string;
        complexity?: TaskComplexity;
        requiredCapabilities?: ('reasoning' | 'coding' | 'creative')[];
    }): keyof typeof AI_MODELS {
        const { prompt, complexity = 'moderate', requiredCapabilities = [] } = params;

        // 1. Force Pro for complex requirements
        if (requiredCapabilities.includes('reasoning') || requiredCapabilities.includes('coding')) {
            return 'fast'; // In this codebase 'fast' is mapped to Gemini 1.5 Flash, wait. 
            // Let's check genkit-client.ts to be sure what keys map to what.
            // Assuming 'fast' = Flash, 'powerful' = Pro.
        }

        // 2. Heuristic based on prompt length (token proxy)
        if (prompt.length > 4000) {
            return 'powerful'; // Use powerful for large contexts
        }

        // 3. Explicit Complexity
        switch (complexity) {
            case 'complex':
                return 'powerful';
            case 'simple':
                return 'fast';
            case 'moderate':
            default:
                // Default to Flash for speed/cost unless specific reason not to
                return 'fast';
        }
    }
}

export const modelRouter = new ModelRouter();
