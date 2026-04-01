import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyzeQualityReportUseCase } from './AnalyzeQualityReportUseCase';

describe('AnalyzeQualityReportUseCase', () => {
    let uc: AnalyzeQualityReportUseCase;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockOrderReader: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockQASentinel: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockNoteWriter: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockLogger: any;

    beforeEach(() => {
        mockOrderReader = { getOrderWithBrief: vi.fn() };
        mockQASentinel = { execute: vi.fn() };
        mockNoteWriter = { updateInternalNotes: vi.fn() };
        mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

        uc = new AnalyzeQualityReportUseCase(
            mockOrderReader,
            mockQASentinel,
            mockNoteWriter,
            mockLogger
        );
    });

    it('debe retornar true si el agente QA marca como PASS', async () => {
        mockOrderReader.getOrderWithBrief.mockResolvedValue({
            id: 'ord-123', quotationId: 'q-1', brief: 'Hacer algo', requirements: 'Bien hecho'
        });
        mockQASentinel.execute.mockResolvedValue({
            status: 'PASS', score: 95, feedback: 'Excelente', issues: []
        });

        const result = await uc.execute('ord-123', 'Entregable del prov', 'TEXT');

        expect(result).toBe(true);
        expect(mockNoteWriter.updateInternalNotes).toHaveBeenCalledWith('ord-123', expect.stringContaining('PASS'));
    });

    it('debe propagar error del sistema si la infraestructura AI falla', async () => {
        mockOrderReader.getOrderWithBrief.mockResolvedValue({ id: 'ord-1', brief: 'x' });
        mockQASentinel.execute.mockRejectedValue(new Error('500 API Error'));

        await expect(uc.execute('ord-1', 'x', 'TEXT')).rejects.toThrow(/SYSTEM_AI_EXCEPTION/);
        expect(mockLogger.error).toHaveBeenCalled();
    });
});
