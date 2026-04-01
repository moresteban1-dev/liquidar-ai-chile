import { IQuotationRepository as QuotationRepository } from '@app/ports/IQuotationRepository';
import { QuotationHistoryRepository } from '@app/ports/QuotationHistoryRepository';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { ICommand } from '@core/shared/ICommand';
import { ICommandHandler } from '@core/shared/ICommandHandler';
import { UserRole } from '@/core/domain/auth/UserRole';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { QuotationRequestedItem } from '@core/domain/aggregates/quotation/QuotationRequestedItem';

/**
 * Command to assign a specific provider to a quotation.
 */
export class AssignProviderCommand implements ICommand {
    readonly commandName = 'AssignProviderCommand';
    constructor(
        public readonly quotationId: string,
        public readonly providerId: string,
        public readonly items: QuotationRequestedItem[] = []
    ) { }
}

/**
 * Handler for AssignProviderCommand.
 */
export class AssignProviderHandler implements ICommandHandler<AssignProviderCommand, void> {
    constructor(
        private quotationRepository: QuotationRepository,
        private historyRepository: QuotationHistoryRepository
    ) { }

    async handle(command: AssignProviderCommand): Promise<Result<void, AppError>> {
        const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId));
        if (quotationRes.isFailure()) return fail(AppError.from(quotationRes.getError()));

        const quotation = quotationRes.getValue();
        if (!quotation) return fail(AppError.notFound('Quotation', command.quotationId));

        const previousStatus = quotation.status;

        // Domain Logic
        const assignRes = quotation.assignProvider(new UniqueEntityID(command.providerId), command.items);
        if (assignRes.isFailure()) return fail(AppError.businessRule(assignRes.getError() as string));

        // Persistence
        const saveRes = await this.quotationRepository.save(quotation);
        if (saveRes.isFailure()) return fail(AppError.from(saveRes.getError()));

        // Audit Trail
        await this.historyRepository.recordTransition({
            quotationId: command.quotationId,
            previousStatus: previousStatus as any,
            newStatus: quotation.status as any,
            actorId: 'admin',
            actorType: UserRole.ADMIN,
            comment: `Proveedor asignado: ${command.providerId}`
        });

        return ok(undefined);
    }
}
