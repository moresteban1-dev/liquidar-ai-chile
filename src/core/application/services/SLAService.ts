// src/core/application/services/SLAService.ts

import { ISLAGuardianAgent } from '../ports/IAgents';
import { IOrderRepository } from '@app/ports/IOrderRepository';
import { Logger } from '@app/ports/Logger';
import { Result } from '@core/shared/Result';
import { AppError } from '@shared/AppError';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

export class SLAService {
    constructor(
        private orderRepository: IOrderRepository,
        private slaAgent: ISLAGuardianAgent,
        private logger: Logger
    ) { }

    /**
     * Checks the SLA risk for a specific order.
     * Uses the "7-day / 48-hour" thresholds recommended logic.
     */
    async checkOrderSLARisk(orderId: string): Promise<Result<any, AppError>> {
        const orderRes = await this.orderRepository.findById(new UniqueEntityID(orderId));
        if (orderRes.isFailure() || !orderRes.value) {
            return Result.fail(AppError.notFound('Order', orderId));
        }

        const order = orderRes.value;

        try {
            this.logger.info('Performing AI SLA Risk analysis', { orderId });

            const analysis = await this.slaAgent.execute({
                orderId: order.id.toString(),
                createdAt: order.createdAt.toISOString(),
                eventDate: order.eventDate ? order.eventDate.toISOString() : new Date().toISOString(),
                deliveryDays: 5, // Fallback or fetched from service metadata
                providerHistory: {
                    avgDelayDays: 0.5,
                    completedOrders: 10
                }
            });

            return Result.ok(analysis);
        } catch (error) {
            this.logger.error('SLA Analysis Failed', { orderId, error });
            return Result.fail(AppError.internal('Error en el análisis de SLA'));
        }
    }

    /**
     * Batch check for all active orders to detect risks early.
     */
    async auditActiveOrders(): Promise<Result<any[], AppError>> {
        const activeOrdersRes = await this.orderRepository.query({ 
            filters: { activeOnly: true },
            pageSize: 50 
        });

        if (activeOrdersRes.isFailure()) return activeOrdersRes as any;

        const results = [];
        for (const order of activeOrdersRes.getValue().data) {
            const risk = await this.checkOrderSLARisk(order.id.toString());
            if (risk.isSuccess()) {
                results.push(risk.getValue());
            }
        }

        return Result.ok(results);
    }
}
