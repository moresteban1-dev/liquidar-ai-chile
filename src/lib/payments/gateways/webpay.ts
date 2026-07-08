// ============================================================
// lib/payments/gateways/webpay.ts
// ============================================================

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { WebpayConfig, Payment, PaymentStatus } from '@/types/payments';
import type { IPaymentGatewayService } from '@/types/payments';

// SDK: npm install transbank-sdk
import {
    WebpayPlus, Options, IntegrationApiKeys,
    IntegrationCommerceCodes, Environment
} from 'transbank-sdk';

export class WebpayService implements IPaymentGatewayService {
    slug = 'webpay' as const;

    private getTransaction(config: WebpayConfig) {
        if (config.environment === 'integration') {
            // Modo integración (testing)
            return new WebpayPlus.Transaction(
                new Options(
                    IntegrationCommerceCodes.WEBPAY_PLUS,
                    IntegrationApiKeys.WEBPAY,
                    Environment.Integration
                )
            );
        }

        // Modo producción
        return new WebpayPlus.Transaction(
            new Options(
                config.commerce_code,
                config.api_key,
                Environment.Production
            )
        );
    }

    async createPayment(params: {
        payment: Payment;
        config: WebpayConfig;
        returnUrl: string;
        cancelUrl: string;
    }) {
        const { payment, config } = params;

        const tx = this.getTransaction(config);
        const buyOrder = `ORD-${payment.id.slice(0, 12)}`;
        const sessionId = `SES-${payment.user_id.slice(0, 12)}`;

        // Webpay requires a return URL that it POSTs to. 
        // This should handle the commit.
        // The technical report puts this at /api/payments/webhook/webpay
        const wpReturnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/webpay`;

        const response = await tx.create(
            buyOrder,
            sessionId,
            Number(payment.amount),
            wpReturnUrl
        );

        return {
            external_id: response.token,
            redirect_url: `${response.url}?token_ws=${response.token}`,
            metadata: {
                wp_token: response.token,
                wp_buy_order: buyOrder,
                wp_session_id: sessionId,
            },
        };
    }

    async verifyPayment(params: {
        payment: Payment;
        config: WebpayConfig;
        webhookData?: Record<string, unknown>;
    }) {
        const { payment, config, webhookData } = params;

        const tx = this.getTransaction(config);

        // Webpay sends token_ws in POST/GET
        const token = (webhookData?.token_ws as string) || payment.metadata.wp_token;

        if (!token) {
            throw new Error('No token_ws found to verify');
        }

        try {
            const response = await tx.commit(token);

            let status: PaymentStatus = 'rejected';
            if (response.response_code === 0) {
                status = 'approved';
            }

            return {
                status,
                metadata: {
                    wp_authorization_code: response.authorization_code,
                    wp_card_last_four: response.card_detail?.card_number,
                    wp_buy_order: response.buy_order,
                    wp_transaction_date: response.transaction_date,
                    wp_token: token
                },
            };
        } catch (error: unknown) {
            // Forensic Remediation: Error de idempotencia en Webpay
            // Si el token ya fue usado (doble-click o webhook paralelo), no marcar como rechazado
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isAlreadyCaptured = errorMessage.toLowerCase().includes('already') || 
                                     errorMessage.toLowerCase().includes('used');

            if (isAlreadyCaptured) {
                logger.warn('Webpay Idempotency Hit: Token already used. Maintaining current state.', { token });
                return {
                    status: payment.status, // Retornamos el estado actual para que el servicio no lo cambie
                    metadata: {
                        ...payment.metadata,
                        idempotency_hit: true,
                        last_error: errorMessage
                    },
                };
            }

            logger.error('Webpay Commit Error:', error);
            return {
                status: 'rejected' as PaymentStatus,
                metadata: {
                    error: errorMessage
                },
            };
        }
    }
}
