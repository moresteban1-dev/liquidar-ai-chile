import { ICommand } from '@core/shared/ICommand';
import { ICommandHandler } from '@core/shared/ICommandHandler';
import { Result, ok, fail } from '@core/shared/Result';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { IQuotationRepository as QuotationRepository } from '@app/ports/IQuotationRepository';
import { OptimizationEngine } from '@core/domain/services/OptimizationEngine';
import { AppError } from '@core/shared/AppError';

export class OptimizeQuotationCommand implements ICommand {
    readonly commandName = 'OptimizeQuotationCommand';
    constructor(public readonly quotationId: string) { }
}

/**
 * Handler for OptimizeQuotationCommand.
 * Applies the OptimizationEngine results to the Quotation aggregate.
 */
export class OptimizeQuotationHandler implements ICommandHandler<OptimizeQuotationCommand, number> {
    constructor(private quotationRepository: QuotationRepository) { }

    async handle(command: OptimizeQuotationCommand): Promise<Result<number, AppError>> {
        const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId));

        if (quotationRes.isFailure()) return fail(AppError.from(quotationRes.getError()));
        const quotation = quotationRes.getValue();
        if (!quotation) return fail(AppError.notFound('Quotation', command.quotationId));

        // 1. Calculate Optimization
        const optimizationRes = OptimizationEngine.calculateOptimalMarkup(quotation);
        if (optimizationRes.isFailure()) return fail(optimizationRes.getError());

        const suggestedMarkup = optimizationRes.getValue();

        // 2. Apply Optimization (This uses the existing 'approve' logic under the hood if appropriate, 
        // or we just update the aggregate state)
        // For this sprint, we'll just return the suggestion to the UI, 
        // or we can auto-apply if the admin requests it.

        // Let's assume the command *applies* it.
        const applyRes = quotation.approve(suggestedMarkup);
        if (applyRes.isFailure()) return fail(AppError.businessRule(applyRes.getError()));

        // 3. Save
        const saveRes = await this.quotationRepository.save(quotation);
        if (saveRes.isFailure()) return fail(AppError.from(saveRes.getError() as any));

        return ok(suggestedMarkup);
    }
}
