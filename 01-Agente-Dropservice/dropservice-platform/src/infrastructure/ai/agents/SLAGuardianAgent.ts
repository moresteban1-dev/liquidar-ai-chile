import { SLAInputSchema, SLAOutputSchema } from './types';
import { Logger } from '@app/ports/Logger';
import { AIGenerator } from '@app/ports/AIGenerator';
import { AIAuditPort } from '@core/application/ports/AIAuditPort';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { z } from 'zod';

export class SLAGuardianAgent {
    constructor(
        private logger: Logger,
        private aiGenerator: AIGenerator,
        private auditPort: AIAuditPort
    ) { }

    async execute(input: z.infer<typeof SLAInputSchema>): Promise<Result<z.infer<typeof SLAOutputSchema>, AppError>> {
        const { orderId, createdAt, eventDate, deliveryDays, providerHistory } = input;

        const prompt = `
          Eres el "SLA Guardian" de una plataforma de Dropservice.
          Tu objetivo es predecir riesgos de retraso en la producción de pedidos.

          DATOS DEL PEDIDO:
          - ID Órden: ${orderId}
          - Creado en: ${createdAt}
          - Fecha del Evento: ${eventDate}
          - Días de Entrega Prometidos (Delivery Days): ${deliveryDays}
          
          HISTORIAL DEL PROVEEDOR:
          - Retraso promedio histórico: ${providerHistory?.avgDelayDays || 0} días.
          - Órdenes completadas: ${providerHistory?.completedOrders || 0}

          REGLAS:
          1. Calcula daysUntilDeadline basándote en la fecha del evento.
          2. Determina el riskLevel basándote en la cercanía de la fecha límite y el historial de retraso del proveedor.
          3. Emite alertType 'PREVENTIVE' si faltan < 7 días y no hay progreso.
          4. Emite alertType 'CRITICAL' si faltan < 2 días y no hay progreso.
        `;

        try {
            const { object } = await this.aiGenerator.generateObject({
                model: 'gpt-4o-mini',
                schema: SLAOutputSchema,
                prompt: prompt,
            });

            if (object.isAlertNeeded) {
                await this.auditPort.log({
                    agentName: 'SLAGuardian',
                    agentVersion: 'v1.0',
                    action: 'SLA_RISK_ALERT',
                    decision: object.alertType === 'CRITICAL' ? 'rejected' : 'suggested',
                    autonomyLevel: 'human_only',
                    confidence: object.confidence,
                    reasoning: object.reasoning,
                    aggregateType: 'ORDER',
                    aggregateId: orderId,
                    modelUsed: 'gpt-4o-mini',
                    metadata: { riskLevel: object.riskLevel, daysUntilDeadline: object.daysUntilDeadline, alertType: object.alertType }
                });
            }

            return ok(object);
        } catch (error) {
            this.logger.error('[SLAGuardianAgent] SLA Check Failed', error);
            return fail(AppError.internal(`SLA check failed: ${error instanceof Error ? error.message : String(error)}`));
        }
    }
}
