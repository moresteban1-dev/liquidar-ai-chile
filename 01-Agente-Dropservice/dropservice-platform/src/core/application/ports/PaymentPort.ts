import { Result } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

/**
 * PaymentPort — Domain-level contract for payment operations.
 */
export type PaymentStatusType =
    | 'PENDING'
    | 'PROCESSING'
    | 'CONFIRMED'
    | 'FAILED'
    | 'REFUNDED'
    | 'EXPIRED'
    | 'PENDING_RECEIPT'
    | 'PENDING_ADMIN_REVIEW'
    | 'REJECTED';

export interface CreatePaymentInput {
    quotationId: string;
    amount: number;
    currency: string;
    gatewaySlug: string;
    userId: string;
    description?: string;
}

export interface PaymentResult {
    paymentId: string;
    status: PaymentStatusType;
    redirectUrl?: string;
    externalReference?: string;
}

export interface PaymentPort {
    /**
     * Creates a payment intent/record and initiates the gateway flow.
     */
    createPayment(input: CreatePaymentInput): Promise<Result<PaymentResult, AppError>>;

    /**
     * Processes an incoming webhook notification from a payment gateway.
     */
    processWebhook(
        gatewaySlug: string,
        eventType: string,
        payload: Record<string, unknown>,
    ): Promise<Result<boolean, AppError>>;

    /**
     * Admin approves or rejects a manual transfer.
     */
    confirmManualTransfer(
        paymentId: string,
        adminId: string,
        action: 'approve' | 'reject',
        notes?: string,
    ): Promise<Result<void, AppError>>;

    /**
     * Fetches current payment status by ID.
     */
    getPaymentStatus(paymentId: string): Promise<Result<PaymentStatusType | null, AppError>>;
}
