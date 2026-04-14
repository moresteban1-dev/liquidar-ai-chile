import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NegotiateProviderBidUseCase } from './NegotiateProviderBidUseCase';
import { Result, ok, fail } from '@core/shared/Result';

describe('NegotiateProviderBidUseCase', () => {
    let uc: NegotiateProviderBidUseCase;
     
    let mockQuotationRepo: any;
     
    let mockNegotiatorAgent: any;
     
    let mockNoteWriter: any;
     
    let mockLogger: any;

    beforeEach(() => {
        mockQuotationRepo = { findById: vi.fn() };
        mockNegotiatorAgent = { execute: vi.fn() };
        mockNoteWriter = { updateInternalNotes: vi.fn() };
        mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

        uc = new NegotiateProviderBidUseCase(
            mockQuotationRepo,
            mockNegotiatorAgent,
            mockNoteWriter,
            mockLogger
        );
    });

    it('debe retornar false si la cotizacion no existe', async () => {
        mockQuotationRepo.findById.mockResolvedValue(fail('Not found'));
        const result = await uc.execute('q-123', 'p-456');
        expect(result).toBe(false);
        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Quotation not found'));
    });

    it('debe aprobar y escribir nota si el agente decide APPROVE', async () => {
        mockQuotationRepo.findById.mockResolvedValue(ok({ id: 'q-123', totalProviderNet: { amount: 1000 }, props: { serviceName: 'Test' } }));
        mockNegotiatorAgent.execute.mockResolvedValue({
            decision: 'APPROVE',
            reasoning: 'Buen precio'
        });

        const result = await uc.execute('q-123', 'p-456');

        expect(result).toBe(true);
        expect(mockNoteWriter.updateInternalNotes).toHaveBeenCalledWith('q-123', expect.stringContaining('Márgenes Pre-Aprobados. Buen precio'));
    });

    it('debe registrar el rechazo u otra decision si no es APPROVE', async () => {
        mockQuotationRepo.findById.mockResolvedValue(ok({ id: 'q-123', totalProviderNet: { amount: 1000 }, props: { serviceName: 'Test' } }));
        mockNegotiatorAgent.execute.mockResolvedValue({
            decision: 'NEGOTIATE',
            reasoning: 'Precio alto',
            suggestedCounterOffer: 800,
            replyToUser: 'Te ofrezco 800'
        });

        const result = await uc.execute('q-123', 'p-456');

        expect(result).toBe(true);
        expect(mockNoteWriter.updateInternalNotes).toHaveBeenCalledWith('q-123', expect.stringContaining('Sugiere Re-Negociar'));
    });
});
