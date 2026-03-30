// src/core/application/services/AIBrokerService.ts

import { z } from 'zod';
import { Logger } from '@domain/ports/Logger';
import { AIGenerator } from '@core/application/ports/AIGenerator';
import { ProviderInventoryRepository, ProviderProfile } from '@core/application/ports/ProviderInventoryRepository';
import { QuotationRepository } from '@core/application/ports/QuotationRepository';
import { QuotationStatus } from '@core/domain/aggregates/quotation/QuotationStatus';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import type { QuotationService } from './quotation-service';
import type { ConfidenceService } from './ConfidenceService';
import type { AIAuditPort } from '@core/application/ports/AIAuditPort';

const aiBrokerSchema = z.object({
    matching_score: z.number().min(0).max(100).describe('Puntaje de afinidad entre el proveedor y la cotización (0-100).'),
    reason: z.string().describe('Razón breve de la calificación dada.'),
});

/**
 * AI Broker Service
 * 
 * Orchestrates the matching of providers to quotations using AI.
 * Adheres to Hexagonal Architecture via port injection.
 */
export class AIBrokerService {
    constructor(
        private logger: Logger,
        private aiGenerator: AIGenerator,
        private providerRepo: ProviderInventoryRepository,
        private quotationRepo: QuotationRepository,
        private quotationService: QuotationService,
        private confidenceService: ConfidenceService,
        private auditPort: AIAuditPort
    ) { }

    /**
     * Matches the best provider for a given quotation using AI and assigns it if the score is high enough.
     */
    async matchProviderForQuotation(quotationId: string): Promise<{ success: boolean; bestScore?: number; assignedTo?: string; reason?: string }> {
        this.logger.info(`Iniciando AI Broker Matching para cotización: ${quotationId}`);

        try {
            // 1. Obtener la cotización
            const quotationResult = await this.quotationRepo.findById(new UniqueEntityID(quotationId));

            if (quotationResult.isFailure() || !quotationResult.value) {
                this.logger.error(`Cotización no encontrada o error: ${quotationId}`);
                return { success: false, reason: 'Quotation not found' };
            }

            const quotation = quotationResult.value;

            // 2. Obtener lista de proveedores
            const providersResult = await this.providerRepo.getAllProviders();

            if (providersResult.isFailure() || !providersResult.value || providersResult.value.length === 0) {
                this.logger.warn('No hay proveedores registrados o error en repo');
                return { success: false, reason: 'No providers available' };
            }

            const providers = providersResult.value;

            let bestScore = 0;
            let bestProvider: ProviderProfile | null = null;
            let finalReason = '';

            const quotationBrief = `Requerimiento: ${quotation.brief || 'ND'}. Servicio: ${quotation.serviceName || 'ND'}. Presupuesto: ${quotation.priceTotalAmount || 'ND'}`;

            // 3. Loop: Pedimos al LLM que evalúe a cada proveedor
            for (const p of providers) {
                const expertiseResult = await this.providerRepo.getProviderExpertise(p.id);
                const expertise = expertiseResult.isSuccess() ? expertiseResult.value : 'No disponible';

                const prompt = `
          Eres el "Dropservice AI Broker".
          Tu objetivo es calificar del 0 al 100 qué tan idóneo es un Proveedor para ejecutar el requerimiento del Cliente.
          
          --- REQUERIMIENTO DEL CLIENTE:
          ${quotationBrief}

          --- PERFIL DEL PROVEEDOR A EVALUAR:
          Nombre: ${p.name || 'Empresa Anónima'}
          Servicios en Inventario (Expertise): ${expertise}
          
          Asigna un score de idoneidad. Sé estricto. Si no hay relación semántica obvia entre el expertise y el requerimiento, la nota debe ser baja (< 40). Si calza perfecto, > 85.
        `;

                const { object } = await this.aiGenerator.generateObject({
                    model: 'gpt-4o-mini',
                    schema: aiBrokerSchema,
                    prompt,
                });

                if (object.matching_score > bestScore) {
                    bestScore = object.matching_score;
                    bestProvider = p;
                    finalReason = object.reason;
                }
            }

            this.logger.info(`El mejor match fue: ${bestProvider?.name || 'Ninguno'} con ${bestScore} pts.`);

            // Determinar autonomía basándose en el score final
            const autonomy = this.confidenceService.getAutonomyRecommendation('NEGOTIATOR', bestScore / 100);

            // 4. Si el puntaje sobrepasa el threshold de full_auto, auto-asignamos.
            if (bestProvider && autonomy === 'full_auto') {
                this.logger.info(`Threshold de confianza superado (${bestScore}%). Procediendo a auto-asignación.`);

                try {
                    const result = await this.quotationService.transitionQuotation(quotationId, QuotationStatus.AWAITING_CLIENT_PAYMENT, {
                        assignedProviderId: bestProvider.id,
                        markupPercentage: 50,
                        internalNotes: `Auto-asignado por AI Broker (Score: ${bestScore}/100)`
                    });

                    if (result.isFailure()) {
                        return { success: false, reason: result.getError().message };
                    }

                    await this.auditPort.log({
                        agentName: 'AIBroker',
                        agentVersion: 'v1.1',
                        action: 'PROVIDER_MATCHING',
                        decision: 'approved',
                        autonomyLevel: 'full_auto',
                        confidence: bestScore / 100,
                        reasoning: `Auto-assigned ${bestProvider.name} with score ${bestScore}. Reason: ${finalReason}`,
                        aggregateType: 'QUOTATION',
                        aggregateId: quotationId,
                        metadata: { bestProviderId: bestProvider.id, bestScore }
                    });

                    return {
                        success: true,
                        bestScore,
                        assignedTo: bestProvider.name || 'Proveedor Asignado',
                        reason: finalReason
                    };
                } catch (assignmentErr: unknown) {
                    const err = assignmentErr instanceof Error ? assignmentErr.message : String(assignmentErr);
                    this.logger.warn(`AI Broker: Falló la asignación final: ${err}`);
                    return { success: false, reason: `Failed during assignment: ${err}` };
                }
            }

            // Si es suggest o human_only (o no se encontró proveedor adecuado)
            if (bestProvider) {
                await this.auditPort.log({
                    agentName: 'AIBroker',
                    agentVersion: 'v1.1',
                    action: 'PROVIDER_MATCHING',
                    decision: 'suggested',
                    autonomyLevel: autonomy,
                    confidence: bestScore / 100,
                    reasoning: `Score ${bestScore} requires review. Autonomy: ${autonomy}. Reason: ${finalReason}`,
                    aggregateType: 'QUOTATION',
                    aggregateId: quotationId,
                    metadata: { bestProviderId: bestProvider.id, bestScore }
                });
            }

            return { 
                success: true, 
                bestScore, 
                reason: autonomy === 'suggest' 
                    ? `Match sugerido (${bestScore} pts), requiere revisión humana. Razón: ${finalReason}` 
                    : `Ningún proveedor cumple los requisitos mínimos de confianza (Mejor score: ${bestScore}).` 
            };

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error in AI Broker Service', errorMessage);
            return { success: false, reason: 'Internal error during processing' };
        }
    }
}

// Eliminated impure Singleton Wrapper. Instantiation is handled via external DI Container.
