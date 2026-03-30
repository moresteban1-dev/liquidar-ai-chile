/**
 * AnalyzeQualityReportUseCase — Purified (Hexagonal Compliant)
 *
 * Orchestrates AI-powered quality analysis of vendor deliverables.
 * All dependencies are injected via constructor — no direct infrastructure imports.
 *
 * @module core/application/use-cases/AnalyzeQualityReportUseCase
 */

import { Result, ok, fail } from '@core/shared/Result';
import { Logger } from '@domain/ports/Logger';

/** Port interface for the QA agent — decouples from concrete AI impl */
interface QASentinelAgentPort {
    execute(input: {
        briefContent: string;
        deliverableContent: string;
        deliverableType: 'TEXT' | 'IMAGE' | 'URL';
    }): Promise<{
        status: 'PASS' | 'FAIL' | 'NEEDS_REVISION';
        score: number;
        feedback: string;
        issues?: string[];
    }>;
}

/** Port for fetching order + quotation brief data */
interface OrderBriefReader {
    getOrderWithBrief(orderId: string): Promise<{
        id: string;
        quotationId: string;
        brief: string;
        requirements?: string;
    } | null>;
}

/** Port for persisting QA results */
interface OrderNoteWriter {
    updateInternalNotes(orderId: string, notes: string): Promise<void>;
}

export class AnalyzeQualityReportUseCase {
    constructor(
        private readonly orderReader: OrderBriefReader,
        private readonly qaSentinel: QASentinelAgentPort,
        private readonly noteWriter: OrderNoteWriter,
        private readonly logger: Logger,
    ) { }

    async execute(
        orderId: string,
        providerNotes: string,
        deliverableType: 'TEXT' | 'IMAGE' | 'URL',
    ): Promise<Result<boolean, Error>> {
        this.logger.info(`[AnalyzeQuality] Starting QA Sentinel for order: ${orderId}`);

        try {
            // 1. Fetch order and original quotation brief via port
            const orderData = await this.orderReader.getOrderWithBrief(orderId);

            if (!orderData) {
                return fail(new Error(`Order not found: ${orderId}`));
            }

            const fullBrief = orderData.requirements
                ? `${orderData.brief} Requerimientos adicionales: ${orderData.requirements}`
                : orderData.brief;

            this.logger.info(`[AnalyzeQuality] Analyzing deliverable against brief`);

            // 2. Invoke QA agent through port
            const result = await this.qaSentinel.execute({
                briefContent: fullBrief,
                deliverableContent: providerNotes,
                deliverableType,
            });

            this.logger.info(`[AnalyzeQuality] Result: Score [${result.score}/100] - Status [${result.status}]`);

            // 3. Persist QA verdict
            const qaLog = `[QA Sentinel] Status: ${result.status}. Score: ${result.score}/100. Feedback: ${result.feedback}. Issues: ${result.issues?.join(', ') || 'Ninguno'}`;
            await this.noteWriter.updateInternalNotes(orderId, qaLog);

            return ok(result.status === 'PASS');
        } catch (error) {
            this.logger.error('[AnalyzeQuality] QA workflow infrastructure failed', error);
            return fail(new Error('SYSTEM_AI_EXCEPTION: El analizador de calidad ha sufrido un problema técnico, reintente más tarde.')); 
        }
    }
}
