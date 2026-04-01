import { QuotationStatus } from '@core/domain/aggregates/quotation/QuotationStatus';
import { Result } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

export interface QuotationSummary {
    id: string;
    clientId: string;
    clientEmail?: string;
    serviceId: string;
    serviceName?: string;
    code: string;
    status: QuotationStatus;
    totalAmount: number;
    currency: string;
    eventDate: Date;
    updatedAt: Date;
}

export interface ReadModelRepository {
    getQuotationSummary(id: string): Promise<Result<QuotationSummary | null, AppError>>;
    listRecentSummaries(limit: number): Promise<Result<QuotationSummary[], AppError>>;
    getFinancialStats(startDate: Date, endDate: Date): Promise<Result<{
        totalRevenue: number;
        totalQuotations: number;
        averageTicket: number;
    }, AppError>>;
}
