import { describe, it, expect } from 'vitest';
import { VariantGeneratorService } from '@/core/application/services/VariantGeneratorService';
import { QuoteSession } from '@/core/domain/quote/QuoteTypes';

describe('VariantGeneratorService', () => {
    const generator = new VariantGeneratorService();

    describe('inferSegment', () => {
        it('should infer AGENCIA for BTL or Agency keywords', () => {
            expect(generator.inferSegment('Evento BTL')).toBe('AGENCIA');
            expect(generator.inferSegment('Agencia de Marketing')).toBe('AGENCIA');
        });

        it('should infer PUBLICO for Government keywords', () => {
            expect(generator.inferSegment('Evento Municipalidad')).toBe('PUBLICO');
            expect(generator.inferSegment('Acto de Gobierno')).toBe('PUBLICO');
        });

        it('should infer SOCIAL_PREMIUM for Wedding or Social keywords', () => {
            expect(generator.inferSegment('Boda de Gala')).toBe('SOCIAL_PREMIUM');
            expect(generator.inferSegment('Matrimonio Civil')).toBe('SOCIAL_PREMIUM');
        });

        it('should default to CORPORATIVO', () => {
            expect(generator.inferSegment('Seminario IT')).toBe('CORPORATIVO');
            expect(generator.inferSegment('')).toBe('CORPORATIVO');
        });
    });

    describe('generateOptions', () => {
        it('should fail if budget is 0 or negative', () => {
            const session: Partial<QuoteSession> = { budget: 0, eventType: 'TEST' };
            const result = generator.generateOptions(session);
            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toContain('presupuesto ancla debe ser mayor a 0');
        });

        it('should fail if eventType is missing', () => {
            const session: Partial<QuoteSession> = { budget: 1000 };
            const result = generator.generateOptions(session);
            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toContain('tipo de evento es requerido');
        });

        it('should generate three variants with correct math for CORPORATIVO', () => {
            const session: Partial<QuoteSession> = { 
                budget: 1000000, 
                eventType: 'Corporativo',
                segment: 'CORPORATIVO',
                requestedItems: [{ catalogItemId: 'item-1', isCustom: false }]
            };

            const result = generator.generateOptions(session);
            expect(result.isSuccess()).toBe(true);
            
            const options = result.getValue();
            expect(options).toHaveLength(3);

            // ECONOMICA: 85% budget, 35% margin
            const eco = options.find(o => o.optionType === 'ECONOMICA');
            expect(eco?.totalValue).toBe(850000);
            expect(eco?.marginApplied).toBe(35);

            // RECOMENDADA: 110% budget, 42% margin
            const rec = options.find(o => o.optionType === 'RECOMENDADA');
            expect(rec?.totalValue).toBe(1100000);
            expect(rec?.marginApplied).toBe(42);

            // PREMIUM: 150% budget, 50% margin
            const pre = options.find(o => o.optionType === 'PREMIUM');
            expect(pre?.totalValue).toBe(1500000);
            expect(pre?.marginApplied).toBe(50);
        });
    });
});
