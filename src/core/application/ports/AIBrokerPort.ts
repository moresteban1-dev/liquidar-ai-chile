import { Result } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

export type DetectedBias = {
    type: string;
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    textEvidence: string;
    debiasingSuggestion: string;
    confidence: number;
};

export type BiasAnalysisOutput = {
    overallBiasScore: number;
    biasesDetected: DetectedBias[];
    summary: string;
    objectivityScore: number;
    recommendations: string[];
};

export interface AIProviderProposal {
    category: 'SERVICIO' | 'LOGISTICA';
    concept: string;
    description?: string;
    unitPriceNet: number;
    quantity: number;
    totalPriceNet: number;
}

export interface AIClientProposal {
    description: string;
    unitPriceNet: number;
    quantity: number;
    totalPriceNet: number;
}

export interface AIMatch {
    requestedItemId?: string;
    catalogItemId?: string;
    confidence: number;
    reasoning: string;
    providerProposal: AIProviderProposal;
    clientProposal: AIClientProposal;
}

export interface AIMatchResponse {
    matches: AIMatch[];
    summary: string;
}

export interface AIBrokerPort {
    matchServicesWithCatalog(
        brief: string,
        requestedItems: Array<{ id: string; name: string; qty: number }>,
        catalogContext: Array<{ id: string; name: string; description: string | null; category?: string; price?: number | null }>
    ): Promise<Result<AIMatchResponse, AppError>>;

    analyzeQuotationBias(
        content: string,
        options: { depth: 'quick' | 'standard' | 'deep'; language: string }
    ): Promise<Result<BiasAnalysisOutput, AppError>>;

    analyzeBias(quotation: unknown): Promise<Result<BiasAnalysisOutput, AppError>>;
}
