import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuotationService } from './quotation-service';
import { IQuotationRepository as QuotationRepository } from '@app/ports/IQuotationRepository';
import { QuotationStatus } from '@core/domain/aggregates/quotation/QuotationStatus';
import { ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { createTestQuotation } from '@tests/setup/test-factories';

// Mock Notifications (side effect)
vi.mock('../notifications', () => ({
    notifyQuoteReady: vi.fn().mockResolvedValue(true)
}));

// Mock Repository
const mockRepo = {
    findById: vi.fn(),
    save: vi.fn().mockResolvedValue(ok(undefined)),
    getClientQuotationView: vi.fn(),
    getAdminQuotationView: vi.fn(),
} as unknown as QuotationRepository;

const mockHistoryRepo = {
    recordTransition: vi.fn().mockResolvedValue(undefined),
} as any;

const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
} as any;

describe('QuotationService', () => {
    let service: QuotationService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new QuotationService(mockRepo, mockHistoryRepo, mockLogger);
    });

    it('should return failure if quotation does not exist', async () => {
        vi.mocked(mockRepo.findById).mockResolvedValue(ok(null));

        const result = await service.transitionQuotation('invalid-id', QuotationStatus.PENDING_ASSIGNMENT);

        expect(result.isFailure()).toBe(true);
        expect((result.getError() as any).message).toContain('not found');
    });

    it('should return failure if repository returns failure', async () => {
        vi.mocked(mockRepo.findById).mockResolvedValue(fail(AppError.infrastructure('DB connection lost')));

        const result = await service.transitionQuotation('some-id', QuotationStatus.PENDING_ASSIGNMENT);

        expect(result.isFailure()).toBe(true);
    });

    it('should return failure for invalid state transition', async () => {
        // A DRAFT quotation cannot jump to PAID
        const quote = createTestQuotation({ status: 'DRAFT' });
        vi.mocked(mockRepo.findById).mockResolvedValue(ok(quote));

        const result = await service.transitionQuotation(
            quote.quotationId.toString(),
            QuotationStatus.PAID
        );

        expect(result.isFailure()).toBe(true);
    });
});
