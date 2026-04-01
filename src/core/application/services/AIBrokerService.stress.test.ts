import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIBrokerService } from './AIBrokerService';
import { Result, ok } from '@core/shared/Result';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { Quotation } from '@core/domain/aggregates/quotation/Quotation';
import { ConfidenceService } from './ConfidenceService';

describe('AIBrokerService Stress Test (Low Confidence)', () => {
    // 1. Mocks
    const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any;
    const mockAIGenerator = { generateObject: vi.fn() } as any;
    const mockProviderRepo = { getAllProviders: vi.fn(), getProviderExpertise: vi.fn() } as any;
    const mockQuotationRepo = { findById: vi.fn() } as any;
    const mockQuotationService = { transitionQuotation: vi.fn() } as any;
    const mockAuditPort = { log: vi.fn() } as any;
    
    let service: AIBrokerService;
    const confidenceService = new ConfidenceService();

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AIBrokerService(
            mockLogger,
            mockAIGenerator,
            mockProviderRepo,
            mockQuotationRepo,
            mockQuotationService,
            confidenceService,
            mockAuditPort
        );
    });

    it('should NOT auto-assign and return "suggest" when best score is 65%', async () => {
        // GIVEN: A quotation and a provider
        const quote = Quotation.create('client-1', 'service-1', new Date(), new Date()).value;
        const provider = { id: 'prov-1', name: 'Low Confidence Provider' };

        vi.mocked(mockQuotationRepo.findById).mockResolvedValue(ok(quote));
        vi.mocked(mockProviderRepo.getAllProviders).mockResolvedValue(ok([provider]));
        vi.mocked(mockProviderRepo.getProviderExpertise).mockResolvedValue(ok('Some expertise'));

        // GIVEN: AI returns a mediocre score (65)
        vi.mocked(mockAIGenerator.generateObject).mockResolvedValue({
            object: { matching_score: 65, reason: 'Relevant but not a perfect match.' }
        });

        // WHEN: We match
        const result = await service.matchProviderForQuotation(quote.id);

        // THEN:
        // 1. result should indicate success but no auto-assignment
        expect(result.success).toBe(true);
        expect(result.bestScore).toBe(65);
        expect(result.reason).toContain('Match sugerido');
        expect(result.reason).toContain('requiere revisión humana');

        // 2. quotationService.transitionQuotation should NOT have been called
        expect(mockQuotationService.transitionQuotation).not.toHaveBeenCalled();

        // 3. AIAuditPort should have logged a 'suggested' decision
        expect(mockAuditPort.log).toHaveBeenCalledWith(expect.objectContaining({
            action: 'PROVIDER_MATCHING',
            decision: 'suggested',
            autonomyLevel: 'suggest',
            confidence: 0.65
        }));

        console.log('✅ Stress Test Passed: Human-in-the-loop triggered correctly for score 65.');
    });

    it('should auto-assign when score is 95% (High Confidence)', async () => {
        const quote = Quotation.create('client-1', 'service-1', new Date(), new Date()).value;
        const provider = { id: 'prov-1', name: 'High Confidence Provider' };

        vi.mocked(mockQuotationRepo.findById).mockResolvedValue(ok(quote));
        vi.mocked(mockProviderRepo.getAllProviders).mockResolvedValue(ok([provider]));
        vi.mocked(mockProviderRepo.getProviderExpertise).mockResolvedValue(ok('Perfect matching expertise'));
        vi.mocked(mockQuotationService.transitionQuotation).mockResolvedValue(ok(quote));

        // GIVEN: AI returns a high score (95)
        vi.mocked(mockAIGenerator.generateObject).mockResolvedValue({
            object: { matching_score: 95, reason: 'Perfect match for this requirement.' }
        });

        // WHEN: We match
        const result = await service.matchProviderForQuotation(quote.id);

        // THEN:
        expect(result.bestScore).toBe(95);
        expect(mockQuotationService.transitionQuotation).toHaveBeenCalled();
        expect(mockAuditPort.log).toHaveBeenCalledWith(expect.objectContaining({
            decision: 'approved',
            autonomyLevel: 'full_auto',
            confidence: 0.95
        }));

        console.log('✅ High Confidence Test Passed: Auto-assignment triggered for score 95.');
    });
});
