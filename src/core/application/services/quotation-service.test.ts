import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuotationService } from './quotation-service';
import { Quotation } from '@core/domain/aggregates/quotation/Quotation';
import { IQuotationRepository as QuotationRepository } from '@app/ports/IQuotationRepository';
import { QuotationStatus } from '@core/domain/aggregates/quotation/QuotationStatus';

// Mock Repository
const mockRepo = {
    findById: vi.fn(),
    save: vi.fn(),
} as unknown as QuotationRepository;

// Mock Notifications (side effect)
vi.mock('../notifications', () => ({
    notifyQuoteReady: vi.fn().mockResolvedValue(true)
}));
const mockHistoryRepo = {
    recordTransition: vi.fn(),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('QuotationService', () => {
    let service: QuotationService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new QuotationService(mockRepo, mockHistoryRepo, mockLogger);
    });

    it('should throw error if quotation does not exist', async () => {
        vi.mocked(mockRepo.findById).mockResolvedValue(null);

        await expect(service.transitionQuotation('invalid-id', QuotationStatus.PENDING_ASSIGNMENT))
            .rejects.toThrow('Cotización no encontrada');
    });

    it('should update status successfully for valid transition to PENDING_ASSIGNMENT', async () => {
        // Create a real quotation via factory to ensure validity
        const quoteResult = Quotation.create('client-123', 'service-123', new Date(), new Date(Date.now() + 10000));
        const quote = quoteResult.value;
        quote.addItem('Test Item', 1);

        vi.mocked(mockRepo.findById).mockResolvedValue(quote);

        await service.transitionQuotation(quote.id, QuotationStatus.PENDING_ASSIGNMENT);

        expect(mockRepo.findById).toHaveBeenCalledWith(quote.id);
        expect(quote.status).toBe(QuotationStatus.PENDING_ASSIGNMENT);
        expect(mockRepo.save).toHaveBeenCalledWith(quote);
    });

    it('should assign provider successfully (PENDING_PROVIDER_BID)', async () => {
        const quoteResult = Quotation.create('client-123', 'service-123', new Date(), new Date(Date.now() + 10000));
        const quote = quoteResult.value;
        quote.addItem('Test Item', 1);
        quote.sendToProviders(); // Set to PENDING_ASSIGNMENT

        vi.mocked(mockRepo.findById).mockResolvedValue(quote);

        await service.transitionQuotation(quote.id, QuotationStatus.PENDING_PROVIDER_BID, {
            assignedProviderId: 'provider-123'
        });

        expect(quote.status).toBe(QuotationStatus.PENDING_PROVIDER_BID);
        expect(quote.assignedProviderId).toBe('provider-123');
        expect(mockRepo.save).toHaveBeenCalledWith(quote);
    });

    it('should approve quotation successfully (AWAITING_CLIENT_PAYMENT)', async () => {
        const quoteResult = Quotation.create('client-123', 'service-123', new Date(), new Date(Date.now() + 10000));
        const quote = quoteResult.value;
        quote.addItem('Test Item', 1);
        quote.sendToProviders();
        quote.assignProvider('provider-123');

        // Add a bid manually to the aggregate to simulate state
        const BidItemClass = (await import('@core/domain/aggregates/quotation/BidItem')).BidItem;
        const ProviderBidClass = (await import('@core/domain/aggregates/quotation/Quotation')).ProviderBid;
        const MoneyClass = (await import('@core/domain/value-objects/Money')).Money; // Ensure Money is available if needed

        const bidItem = BidItemClass.create('Item', 1, MoneyClass.create(1000).value, 'SERVICE').value;
        const bid = ProviderBidClass.create('provider-123', [bidItem], 3).value;
        quote.addBid(bid);
        // Now status is PENDING_ADMIN_APPROVAL automatically or via explicit transition?
        // In my logic, addBid sets it to PENDING_ADMIN_APPROVAL.

        vi.mocked(mockRepo.findById).mockResolvedValue(quote);

        await service.transitionQuotation(quote.id, QuotationStatus.AWAITING_CLIENT_PAYMENT, {
            markupPercentage: 20
        });

        expect(quote.status).toBe(QuotationStatus.AWAITING_CLIENT_PAYMENT);
        expect(quote.markupPercentage).toBe(20);
        expect(quote.priceCost).toBe(1000);
        expect(quote.priceNet).toBe(1200); // 1000 + 20%
        expect(mockRepo.save).toHaveBeenCalledWith(quote);
    });
});
