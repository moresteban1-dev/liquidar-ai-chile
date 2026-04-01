import { AIBrokerPort, AIMatchResponse, BiasAnalysisOutput } from '@app/ports/AIBrokerPort';
import { Result, Success } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { matchServicesWithCatalog } from '@infrastructure/ai/flows/service-matching.flow';
import { analyzeBias } from '@infrastructure/ai/flows/bias-analysis.flow';

/**
 * GenkitAIBrokerAdapter
 * 
 * Adapter for Genkit AI services implementing the AIBrokerPort.
 */
export class GenkitAIBrokerAdapter implements AIBrokerPort {
    async matchServicesWithCatalog(
        brief: string,
        requestedItems: Array<{ id: string; name: string; qty: number }>,
        catalogContext: Array<{ id: string; name: string; description: string | null; category?: string; price?: number | null }>
    ): Promise<Result<AIMatchResponse, AppError>> {
        const result = await matchServicesWithCatalog(brief, requestedItems, catalogContext);
        if (result.isFailure()) return result as any;
        return new Success(result.value);
    }

    async analyzeQuotationBias(
        content: string,
        options: { depth: 'quick' | 'standard' | 'deep'; language: string }
    ): Promise<Result<BiasAnalysisOutput, AppError>> {
        const result = await analyzeBias(content, options);
        if (result.isFailure()) return result as any;
        return new Success(result.value);
    }

    async analyzeBias(quotation: any): Promise<Result<BiasAnalysisOutput, AppError>> {
        // Implementation that converts quotation to text and calls analyzeBias
        const content = JSON.stringify(quotation);
        const result = await analyzeBias(content, { depth: 'standard', language: 'es' });
        if (result.isFailure()) return result as any;
        return new Success(result.value);
    }
}
