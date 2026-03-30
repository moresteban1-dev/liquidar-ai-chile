// ============================================================
// lib/payments/gateways/flow.ts
// Gateway: Flow.cl — Pagos electrónicos Chile (2.95% + $100)
// SDK: npm install axios (already installed)
// ============================================================

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { FlowConfig, Payment, PaymentStatus } from '@/types/payments';
import type { IPaymentGatewayService } from '@/types/payments';
import crypto from 'crypto';

const FLOW_API_PRODUCTION = 'https://www.flow.cl/api';
const FLOW_API_SANDBOX = 'https://sandbox.flow.cl/api';

export class FlowService implements IPaymentGatewayService {
    slug = 'flow' as const;

    private getApiUrl(config: FlowConfig): string {
        return config.environment === 'production'
            ? FLOW_API_PRODUCTION
            : FLOW_API_SANDBOX;
    }

    /**
     * Flow uses HMAC-SHA256 signature.
     * Sort params alphabetically, concatenate key+value, sign with secretKey.
     */
    private sign(
        params: Record<string, string | number>,
        secretKey: string
    ): string {
        const keys = Object.keys(params).sort();
        const data = keys.map(key => `${key}${params[key]}`).join('');
        return crypto
            .createHmac('sha256', secretKey)
            .update(data)
            .digest('hex');
    }

    async createPayment(params: {
        payment: Payment;
        config: FlowConfig;
        returnUrl: string;
        cancelUrl: string;
    }) {
        const { payment, config, returnUrl } = params;

        const apiUrl = this.getApiUrl(config);
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/flow`;

        const flowParams: Record<string, string | number> = {
            apiKey: config.api_key,
            commerceOrder: payment.id,
            subject: `Orden #${payment.order_id.slice(0, 8)}`,
            currency: payment.currency,
            amount: Math.round(Number(payment.amount)),
            email: '',
            urlConfirmation: webhookUrl,
            urlReturn: `${returnUrl}?payment_id=${payment.id}`,
        };

        flowParams['s'] = this.sign(flowParams, config.secret_key);

        const response = await fetch(`${apiUrl}/payment/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(
                flowParams as Record<string, string>
            ).toString(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Flow createPayment failed: ${response.status} — ${JSON.stringify(errorData)}`
            );
        }

        const data = await response.json();

        return {
            external_id: data.flowOrder?.toString() || data.token,
            redirect_url: `${apiUrl}/payment/pay?token=${data.token}`,
            metadata: {
                flow_token: data.token,
                flow_order: data.flowOrder?.toString(),
                flow_url: data.url,
            },
        };
    }

    async verifyPayment(params: {
        payment: Payment;
        config: FlowConfig;
        webhookData?: Record<string, unknown>;
    }) {
        const { payment, config, webhookData } = params;

        const token =
            (webhookData?.token as string) ||
            payment.metadata.flow_token ||
            payment.external_id;

        if (!token) {
            throw new Error('No Flow token found to verify');
        }

        const apiUrl = this.getApiUrl(config);

        const statusParams: Record<string, string | number> = {
            apiKey: config.api_key,
            token,
        };

        statusParams['s'] = this.sign(statusParams, config.secret_key);

        const queryString = new URLSearchParams(
            statusParams as Record<string, string>
        ).toString();

        const response = await fetch(
            `${apiUrl}/payment/getStatus?${queryString}`
        );

        if (!response.ok) {
            logger.error(`Flow verifyPayment failed: ${response.status}`);
            return {
                status: 'rejected' as PaymentStatus,
                metadata: { error: `HTTP ${response.status}` },
            };
        }

        const data = await response.json();

        /**
         * Flow status codes:
         *  1 = pending
         *  2 = approved
         *  3 = rejected
         *  4 = cancelled
         */
        const statusMap: Record<number, PaymentStatus> = {
            1: 'processing',
            2: 'approved',
            3: 'rejected',
            4: 'cancelled',
        };

        return {
            status: statusMap[data.status] || ('pending' as PaymentStatus),
            metadata: {
                flow_order: data.flowOrder?.toString(),
                flow_payment_method: data.paymentData?.media,
                flow_payment_date: data.paymentData?.date,
                flow_status_code: data.status,
            },
        };
    }

    async refundPayment(params: {
        payment: Payment;
        config: FlowConfig;
        amount?: number;
    }) {
        const { payment, config, amount } = params;

        const flowOrder = payment.metadata.flow_order || payment.external_id;
        if (!flowOrder) {
            return { success: false };
        }

        const apiUrl = this.getApiUrl(config);
        const refundAmount = amount ?? Number(payment.amount);

        const refundParams: Record<string, string | number> = {
            apiKey: config.api_key,
            flowOrder,
            amount: Math.round(refundAmount),
        };

        refundParams['s'] = this.sign(refundParams, config.secret_key);

        try {
            const response = await fetch(`${apiUrl}/payment/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(
                    refundParams as Record<string, string>
                ).toString(),
            });

            if (!response.ok) {
                logger.error(`Flow refund failed: ${response.status}`);
                return { success: false };
            }

            const data = await response.json();
            return {
                success: true,
                refund_id: `flow_refund_${data.refundOrder || flowOrder}`,
            };
        } catch (error) {
            logger.error('Flow Refund Error:', error);
            return { success: false };
        }
    }
}
