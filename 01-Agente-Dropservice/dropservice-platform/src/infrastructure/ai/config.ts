import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

/**
 * Initialize Genkit with Google AI (Gemini).
 * This instance will be used to define flows and other AI components.
 */
export const ai = genkit({
    plugins: [googleAI()],
    model: gemini15Flash, // Default model, can be overridden per flow
});
