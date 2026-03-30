import { describe, it, expect } from 'vitest';
import { analysisInputSchema } from '@/lib/validators/analysis';

describe('Analysis Validation Schemas', () => {
    describe('analysisInputSchema', () => {
        it('should validate correct input', () => {
            const valid = {
                title: 'Test Article',
                content: 'This is a sample text with more than 10 characters for testing.',
                type: 'bias',
                options: {
                    depth: 'quick',
                    language: 'es'
                }
            };
            const result = analysisInputSchema.safeParse(valid);
            expect(result.success).toBe(true);
        });

        it('should fail if content is too short', () => {
            const invalid = {
                title: 'Short',
                content: 'Too short',
                type: 'bias'
            };
            const result = analysisInputSchema.safeParse(invalid);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('10 caracteres');
            }
        });

        it('should fail if deep analysis has too little content', () => {
            const invalidDeep = {
                title: 'Deep Fail',
                content: 'Short content is not enough for deep analysis.', // 44 chars
                type: 'bias',
                options: {
                    depth: 'deep'
                }
            };
            const result = analysisInputSchema.safeParse(invalidDeep);
            expect(result.success).toBe(false);
            // Assuming the refine logic triggers an error
        });

        it('should validate deep analysis with sufficient content', () => {
            const validDeep = {
                title: 'Deep Pass',
                content: 'This content is definitely long enough for a deep analysis to be performed correctly by the AI system.', // > 50 chars
                type: 'bias',
                options: {
                    depth: 'deep'
                }
            };
            const result = analysisInputSchema.safeParse(validDeep);
            expect(result.success).toBe(true);
        });
    });
});
