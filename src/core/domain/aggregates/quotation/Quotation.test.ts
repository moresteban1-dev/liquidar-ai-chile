import { describe, it, expect } from 'vitest';
import { Quotation, QuotationItem } from './Quotation';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { Money } from '../../value-objects/Money';
import { QuotationProviderItem } from './QuotationProviderItem';
import { QuotationClientItem } from './QuotationClientItem';

describe('Quotation Aggregate (NASA Grade Coverage)', () => {
    const orderId = new UniqueEntityID();
    const providerId = new UniqueEntityID();
    
    const createBaseQuotation = () => {
        return Quotation.create({
            orderId,
            providerId,
            status: 'DRAFT',
            serviceDescription: 'Evento Corporativo',
            includes: [],
            excludes: [],
            createdAt: new Date()
        }).unwrap();
    };

    describe('State Machine & Transitions', () => {
        it('should transition DRAFT -> SUBMITTED', () => {
            const q = createBaseQuotation();
            const res = q.submit();
            expect(res.isSuccess()).toBe(true);
            expect(q.status).toBe('SUBMITTED');
        });

        it('should fail SUBMITTED -> SUBMITTED (idempotency/invalid)', () => {
            const q = createBaseQuotation();
            q.submit();
            const res = q.submit();
            expect(res.isFailure()).toBe(true);
        });

        it('should transition SUBMITTED -> ANALYZING', () => {
            const q = createBaseQuotation();
            q.submit();
            const res = q.analyze();
            expect(res.isSuccess()).toBe(true);
            expect(q.status).toBe('ANALYZING');
        });

        it('should transition any -> CANCELLED', () => {
            const q = createBaseQuotation();
            q.cancel('Client request');
            expect(q.status).toBe('CANCELLED');
        });
    });

    describe('Item Management', () => {
        it('should add items and update version', () => {
            const q = createBaseQuotation();
            const item: QuotationItem = {
                id: '1',
                itemName: 'Catering',
                quantity: 1,
                unitCost: Money.create(500).unwrap(),
                description: 'Buffet premium'
            };
            q.addItem(item);
            expect(q.requestedItems).toHaveLength(1);
            expect(q.version).toBe(2);
        });

        it('should remove items', () => {
            const q = createBaseQuotation();
            q.addItem({ id: '1', itemName: 'X', quantity: 1, unitCost: Money.create(10).unwrap(), description: '' });
            q.removeItem('1');
            expect(q.requestedItems).toHaveLength(0);
        });
    });

    describe('AI Suggestions Application', () => {
        it('should apply AI suggestions and transition to OPTIMIZED', () => {
            const q = createBaseQuotation();
            q.submit();
            q.analyze();

            const pItem = QuotationProviderItem.create('SERVICE', 'Catering', Money.create(400).unwrap(), 1).unwrap();
            const cItem = QuotationClientItem.create('Catering premium', Money.create(600).unwrap(), 1).unwrap();

            const res = q.applyAISuggestions([pItem], [cItem]);
            expect(res.isSuccess()).toBe(true);
            expect(q.status).toBe('OPTIMIZED');
            expect(q.providerItems).toHaveLength(1);
            expect(q.clientItems).toHaveLength(1);
        });

        it('should fail to apply suggestions if not in ANALYZING status', () => {
            const q = createBaseQuotation();
            const res = q.applyAISuggestions([], []);
            expect(res.isFailure()).toBe(true);
        });
    });
});
