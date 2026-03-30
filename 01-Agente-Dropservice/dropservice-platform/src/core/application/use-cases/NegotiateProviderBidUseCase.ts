/**
 * NegotiateProviderBidUseCase — Purified (Hexagonal Compliant)
 *
 * Orchestrates AI-powered negotiation analysis for provider bids.
 * All dependencies are injected via constructor — no direct infrastructure imports.
 *
 * @module core/application/use-cases/NegotiateProviderBidUseCase
 */

import { Logger } from '@app/ports/Logger';
import { IQuotationRepository as QuotationRepository } from '@app/ports/IQuotationRepository';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

/** Port interface for the negotiation agent — decouples from concrete AI impl */
interface NegotiatorAgentPort {
    execute(input: {
        priceCost: number;
        serviceCategory: string;
        providerId: string;
    }): Promise<{
        decision: 'APPROVE' | 'NEGOTIATE' | 'REJECT';
        reasoning: string;
        suggestedCounterOffer?: number;
        replyToUser?: string;
    }>;
}

/** Port for persisting negotiation notes */
interface QuotationNoteWriter {
    updateInternalNotes(quotationId: string, notes: string): Promise<void>;
}

export class NegotiateProviderBidUseCase {
    constructor(
        private readonly quotationRepo: QuotationRepository,
        private readonly negotiatorAgent: NegotiatorAgentPort,
        private readonly noteWriter: QuotationNoteWriter,
        private readonly logger: Logger,
    ) { }

    async execute(quotationId: string, providerId: string): Promise<boolean> {
        this.logger.info(`[NegotiateProviderBid] Starting AI analysis for quotation: ${quotationId}`);

        try {
            // 1. Fetch quotation through the port
            const quotationRes = await this.quotationRepo.findById(new UniqueEntityID(quotationId));

            if (quotationRes.isFailure() || !quotationRes.getValue()) {
                this.logger.warn(`[NegotiateProviderBid] Quotation not found or error: ${quotationId}`);
                return false;
            }

            const quotation = quotationRes.getValue()!;
            const priceCost = quotation.priceCost;
            const serviceCategory = quotation.serviceName || 'Servicio General';

            if (!priceCost) {
                this.logger.warn('[NegotiateProviderBid] No provider cost found. Skipping.');
                return false;
            }

            // 2. Invoke negotiation agent through the port
            const result = await this.negotiatorAgent.execute({
                priceCost: priceCost.amount,
                serviceCategory,
                providerId,
            });

            this.logger.info(`[NegotiateProviderBid] Verdict: ${result.decision}. Reasoning: ${result.reasoning}`);

            // 3. Persist results based on decision
            if (result.decision === 'APPROVE') {
                const note = `[AI Sentinel]: Márgenes Pre-Aprobados. ${result.reasoning}`;
                await this.noteWriter.updateInternalNotes(quotationId, note);
            } else if (result.decision === 'NEGOTIATE') {
                const note = `[AI Negotiator]: Sugiere Re-Negociar. Veredicto: ${result.reasoning}. Oferta Sugerida: $${result.suggestedCounterOffer}. Mensaje: "${result.replyToUser}"`;
                await this.noteWriter.updateInternalNotes(quotationId, note);
            }

            return true;
        } catch (error) {
            this.logger.error('[NegotiateProviderBid] Workflow failed', error);
            return false;
        }
    }
}
