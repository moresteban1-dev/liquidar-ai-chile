import { IQuotationRepository as QuotationRepository } from '@app/ports/IQuotationRepository';
import { QuotationHistoryRepository } from '@app/ports/QuotationHistoryRepository';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { ICommand } from '@core/shared/ICommand';
import { UserRole } from '@/core/domain/auth/UserRole';
import { ICommandHandler } from '@core/shared/ICommandHandler';

/**
 * Command to apply admin markup and approve the quotation for client review.
 */
export class ApplyMarkupCommand implements ICommand {
    readonly commandName = 'ApplyMarkupCommand';
    constructor(
        public readonly quotationId: string,
        public readonly markupPercentage: number
    ) { }
}

/**
 * Handler for ApplyMarkupCommand.
 */
export class ApplyMarkupHandler implements ICommandHandler<ApplyMarkupCommand, void> {
    constructor(
        private quotationRepository: QuotationRepository,
        private historyRepository: QuotationHistoryRepository
    ) { }

    async handle(command: ApplyMarkupCommand): Promise<Result<void, AppError>> {
        const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId));
        if (quotationRes.isFailure()) return fail(AppError.from(quotationRes.getError()));

        const quotation = quotationRes.getValue();
        if (!quotation) return fail(AppError.notFound('Quotation', command.quotationId));

        const previousStatus = quotation.status;

        // Domain Logic
        const approveRes = quotation.approve(command.markupPercentage);
        if (approveRes.isFailure()) return fail(AppError.businessRule(approveRes.getError()));

        // Persistence
        const saveRes = await this.quotationRepository.save(quotation);
        if (saveRes.isFailure()) return fail(AppError.from(saveRes.getError() as any));

        // Audit Trail
        await this.historyRepository.recordTransition({
            quotationId: command.quotationId,
            previousStatus: previousStatus as any,
            newStatus: quotation.status as any,
            actorId: 'admin',
            actorType: UserRole.ADMIN,
            comment: `Markup aplicado (${command.markupPercentage}%). Cotización enviada a revisión de cliente.`
        });

        return ok(undefined);
    }
}
