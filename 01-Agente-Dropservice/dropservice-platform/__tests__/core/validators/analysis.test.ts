
import { describe, it, expect } from 'vitest';
import { analysisInputSchema } from '@/lib/validators';

describe('analysisInputSchema', () => {
    const validInput = {
        title: 'Test Analysis',
        content: 'Este es un contenido de prueba con suficiente texto.',
        type: 'bias' as const,
        options: { depth: 'standard' as const, language: 'es' },
    };

    it('acepta input válido', () => {
        // Note: analysisInputSchema does NOT have 'title' or 'type' in the definition I created in src/lib/validators/analysis.ts
        // I need to check if I should update the schema or the test.
        // The user provided test includes 'title' and 'type'.
        // The schema I extracted from src/actions/analysis.ts ONLY had content and options.
        // I should update the schema to match the test/requirements OR update the test to match the schema.
        // Given the user request usually implies the desired state, I should probably update the schema to include title and type if they are stripped.
        // BUT, searching src/actions/analysis.ts showed the schema WITHOUT title/type.
        // Let's stick to the schema I saw in code for now, but I suspect the user wants those fields.
        // Actually, looking back at the user request for the test, it explicitly tests `title` and `type`.
        // "const validInput = { title: '...', type: 'bias', ... }"
        // This implies the schema SHOULD have these.
        // I will update the schema in src/lib/validators/analysis.ts to match this test, as it seems to be the "source of truth" for what the user wants validated.

        const result = analysisInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it('rechaza contenido vacío', () => {
        const result = analysisInputSchema.safeParse({
            ...validInput,
            content: '',
        });
        expect(result.success).toBe(false);
    });

    it('rechaza tipo inválido', () => {
        const result = analysisInputSchema.safeParse({
            ...validInput,
            type: 'invalid',
        });
        expect(result.success).toBe(false);
    });

    it('requiere contenido largo para análisis profundo', () => {
        // This test implies a refinement/superRefinement that checks length based on depth?
        // Or just that 'content' min length is enforcing it?
        // The previous schema had min(10).
        const result = analysisInputSchema.safeParse({
            ...validInput,
            content: 'Corto',
            options: { depth: 'deep', language: 'es' },
        });
        expect(result.success).toBe(false);
    });

    it('rechaza campos no definidos (strict)', () => {
        const result = analysisInputSchema.safeParse({
            ...validInput,
            campoInventado: 'valor',
        });
        expect(result.success).toBe(false);
    });
});
