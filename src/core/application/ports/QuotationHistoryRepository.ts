import { Result } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { QuotationStatus } from '@core/domain/aggregates/quotation/QuotationStatus';
import { UserRole } from '@/core/domain/auth/UserRole';

export interface QuotationHistoryRepository {
    recordTransition(params: {
        quotationId: string;
        previousStatus: QuotationStatus;
        newStatus: QuotationStatus;
        actorId: string;
        actorType: UserRole | 'SYSTEM';
        comment?: string;
    }): Promise<Result<void, AppError>>;
}
