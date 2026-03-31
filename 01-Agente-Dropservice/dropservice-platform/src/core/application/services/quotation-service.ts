import { IQuotationRepository as QuotationRepository } from '@core/application/ports/IQuotationRepository';
import { QuotationStatus } from '@core/domain/aggregates/quotation/QuotationStatus';
import { Logger } from '@core/application/ports/Logger';
import { QuotationHistoryRepository } from '@core/application/ports/QuotationHistoryRepository';
import { UserRole } from '@/core/domain/auth/UserRole';

import { Result, ok, fail } from '@core/shared/Result';
import { Quotation } from '@core/domain/aggregates/quotation/Quotation';
import { AppError } from '@core/shared/AppError';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { VALID_INTERNAL_TRANSITIONS } from '@/lib/quotation-fsm';
import { BUSINESS_CONFIG } from '@/config/business-config';

type TransitionData = {
    assignedProviderId?: string;
    itemsPricing?: { itemId: string; costUnit: number }[];
    markupPercentage?: number;
    internalNotes?: string;
};

export class QuotationService {
    constructor(
        private quotationRepository: QuotationRepository,
        private historyRepository: QuotationHistoryRepository,
        private logger: Logger
    ) { }

    /**
     * Orchestrate a transition by loading entity, invoking logic, and saving.
     */
    async transitionQuotation(
        quotationId: string,
        toInternalStatus: QuotationStatus,
        data?: TransitionData
    ): Promise<Result<Quotation, AppError>> {
        const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(quotationId));
        
        if (quotationRes.isFailure()) {
            return fail(quotationRes.getError());
        }

        const quotation = quotationRes.getValue();
        if (!quotation) {
            return fail(AppError.notFound('Quotation', quotationId));
        }

        const previousStatus = quotation.status as unknown as keyof typeof VALID_INTERNAL_TRANSITIONS;
        
        // IDEMPOTENCIA & INTEGRIDAD AAA: Validar contra la FSM
        const allowedTransitions = VALID_INTERNAL_TRANSITIONS[previousStatus] || [];
        if (!allowedTransitions.includes(toInternalStatus as any) && previousStatus !== toInternalStatus) {
            this.logger.error(`[FSM VIOLATION] Intent de transición ilegal: ${previousStatus} -> ${toInternalStatus} en Quotation ${quotationId}`);
            return fail(AppError.businessRule(`Transición no permitida: ${previousStatus} -> ${toInternalStatus}`));
        }

        let actionResult: Result<void, string> = ok(undefined);

        switch (toInternalStatus) {
            case QuotationStatus.PENDING_ASSIGNMENT:
                actionResult = quotation.sendToProviders();
                break;

            case QuotationStatus.PENDING_PROVIDER_BID:
                if (!quotation.assignedProviderId) {
                    if (!data?.assignedProviderId) return fail(AppError.businessRule('assignedProviderId requerido'));
                    actionResult = quotation.assignProvider(data.assignedProviderId);
                } else {
                    actionResult = quotation.returnToProvider();
                }
                break;

            case QuotationStatus.AWAITING_CLIENT_PAYMENT:
                // Note: approve in Quotation aggregate V2 doesn't take markup anymore, 
                // it's handled via pricing update or assumed already set.
                actionResult = quotation.approve();
                break;

            case QuotationStatus.PAID:
                actionResult = quotation.markAsPaid();
                break;

            default:
                break;
        }

        if (actionResult.isFailure()) {
            return fail(AppError.businessRule(actionResult.getError()));
        }

        const saveRes = await this.quotationRepository.save(quotation);
        if (saveRes.isFailure()) {
            return fail(saveRes.getError());
        }

        try {
            await this.historyRepository.recordTransition({
                quotationId,
                previousStatus: previousStatus as QuotationStatus,
                newStatus: quotation.status as QuotationStatus,
                actorId: data?.assignedProviderId || 'system',
                actorType: UserRole.ADMIN,
                comment: `Transición: ${previousStatus} → ${quotation.status}`,
            });
        } catch (error) {
            this.logger.error('Error logging history:', error);
        }

        return ok(quotation);
    }

    async getClientVisibleQuotation(quotationId: string, clientId: string): Promise<Result<any, AppError>> {
        try {
            const data = await this.quotationRepository.getClientQuotationView(quotationId, clientId);
            return ok(data);
        } catch (error) {
            return fail(AppError.from(error));
        }
    }

    async getAdminQuotation(quotationId: string): Promise<Result<any, AppError>> {
        try {
            const data = await this.quotationRepository.getAdminQuotationView(quotationId);
            return ok(data);
        } catch (error) {
            return fail(AppError.from(error));
        }
    }

    async applyMarkup(
        quotationId: string,
        selectedBidId: string,
        _markupPercentage: number = BUSINESS_CONFIG.PRICING.DEFAULT_MARKUP_PERCENTAGE
    ): Promise<Result<Quotation, AppError>> {
        const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(quotationId));
        if (quotationRes.isFailure()) return fail(quotationRes.getError());

        const quotation = quotationRes.getValue();
        if (!quotation) return fail(AppError.notFound('Quotation', quotationId));

        const selectRes = quotation.selectBid(selectedBidId);
        if (selectRes.isFailure()) return fail(AppError.businessRule(selectRes.getError()));

        const approveRes = quotation.approve();
        if (approveRes.isFailure()) return fail(AppError.businessRule(approveRes.getError()));

        const saveRes = await this.quotationRepository.save(quotation);
        if (saveRes.isFailure()) return fail(saveRes.getError());

        return ok(quotation);
    }

    async handleQuotationCreated(quotationId: string): Promise<void> {
        this.logger.info(`Quotation created: ${quotationId}`);
    }
}

// Eliminated impure Singleton Wrapper. The domain service is now instantiated purely via DI Container.
