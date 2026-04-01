import { IQuotationRepository as QuotationRepository } from '@app/ports/IQuotationRepository';
import { AIBrokerPort, BiasAnalysisOutput } from '@app/ports/AIBrokerPort';
import { QuotationId } from '@core/domain/types/branded';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { ICommand } from '@core/shared/ICommand';
import { ICommandHandler } from '@core/shared/ICommandHandler';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

/**
 * Command to trigger a bias analysis on a quotation.
 */
export class AnalyzeQuotationCommand implements ICommand {
    readonly commandName = 'AnalyzeQuotationCommand';
    constructor(
        public readonly quotationId: QuotationId,
        public readonly depth: 'quick' | 'standard' | 'deep' = 'standard'
    ) { }
}

/**
 * Handler for the AnalyzeQuotationCommand.
 * Encapsulates the logic of fetching a quotation and executing the AI flow.
 */
export class AnalyzeQuotationHandler implements ICommandHandler<AnalyzeQuotationCommand, BiasAnalysisOutput> {
    constructor(
        private quotationRepository: QuotationRepository,
        private aiBroker: AIBrokerPort
    ) { }

    async handle(command: AnalyzeQuotationCommand): Promise<Result<BiasAnalysisOutput, AppError>> {
        const quotationRes = await this.quotationRepository.findById(new UniqueEntityID(command.quotationId.toString()));
        if (quotationRes.isFailure()) return fail(AppError.from(quotationRes.getError()));

        const quotation = quotationRes.getValue();
        if (!quotation) {
            return fail(AppError.notFound('Quotation', command.quotationId));
        }

        // Domain Logic
        const analysisRes = await this.aiBroker.analyzeBias(quotation);
        if (analysisRes.isFailure()) return fail(AppError.from(analysisRes.getError()));

        const analysisData = analysisRes.getValue();

        // Business Metrics [NEW]
        const { DomainMetrics } = await import('@infrastructure/telemetry/DomainMetrics');
        DomainMetrics.recordAIBiasAnalysis(analysisData.overallBiasScore);

        return ok(analysisData);
    }
}
