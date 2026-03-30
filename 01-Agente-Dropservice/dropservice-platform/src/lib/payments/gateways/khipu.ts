// ============================================================
// lib/payments/gateways/khipu.ts
// Gateway: Khipu — Transferencia bancaria directa (0.95%)
// SDK: npm install axios (already installed)
// ============================================================

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { KhipuConfig, Payment, PaymentStatus } from '@/types/payments';
import type { IPaymentGatewayService } from '@/types/payments';
import crypto from 'crypto';

const KHIPU_API_BASE = 'https://khipu.com/api/2.0';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __KHIPU_SLA_HOURS = 48;

export class KhipuService implements IPaymentGatewayService {
    slug = 'khipu' as const;

    /**
     * Khipu uses HMAC-SHA256 authentication.
     * Format: "receiverId:hmac(method&url)"
     */
    private generateAuthHeader(
        config: KhipuConfig,
        method: string,
        url: string
    ): string {
        const toSign = `${method}&${url}`;
        const hash = crypto
            .createHmac('sha256', config.secret)
            .update(toSign)
            .digest('hex');

        return `${config.receiver_id}:${hash}`;
    }

    async createPayment(params: {
        payment: Payment;
        config: KhipuConfig;
        returnUrl: string;
        cancelUrl: string;
    }) {
        const { payment, config, returnUrl, cancelUrl } = params;

        const url = `${KHIPU_API_BASE}/payments`;
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/khipu`;

        const payload = new URLSearchParams({
            subject: `Orden #${payment.order_id.slice(0, 8)}`,
            currency: payment.currency,
            amount: String(Math.round(Number(payment.amount))),
            transaction_id: payment.id,
            custom: payment.id,
            body: `Pago orden ${payment.order_id.slice(0, 8)} — DropService`,
            return_url: `${returnUrl}?payment_id=${payment.id}`,
            cancel_url: `${cancelUrl}?payment_id=${payment.id}`,
            notify_url: webhookUrl,
            payer_email: '',
            notify_api_version: '1.3',
        });

        const authHeader = this.generateAuthHeader(config, 'POST', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: payload.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Khipu createPayment failed: ${response.status} — ${JSON.stringify(errorData)}`
            );
        }

        const data = await response.json();

        return {
            external_id: data.payment_id,
            redirect_url: data.payment_url,
            metadata: {
                khipu_payment_id: data.payment_id,
                khipu_payment_url: data.payment_url,
                khipu_simplified_url: data.simplified_transfer_url,
            },
        };
    }

    async verifyPayment(params: {
        payment: Payment;
        config: KhipuConfig;
        webhookData?: Record<string, unknown>;
    }) {
        const { payment, config, webhookData } = params;

        const paymentId =
            (webhookData?.payment_id as string) ||
            payment.metadata.khipu_payment_id ||
            payment.external_id;

        if (!paymentId) {
            throw new Error('No Khipu payment_id found to verify');
        }

        const url = `${KHIPU_API_BASE}/payments/${paymentId}`;
        const authHeader = this.generateAuthHeader(config, 'GET', url);

        const response = await fetch(url, {
            headers: { Authorization: authHeader },
        });

        if (!response.ok) {
            logger.error(`Khipu verifyPayment failed: ${response.status}`);
            return {
                status: 'rejected' as PaymentStatus,
                metadata: { error: `HTTP ${response.status}` },
            };
        }

        const data = await response.json();

        const statusMap: Record<string, PaymentStatus> = {
            done: 'approved',
            pending: 'processing',
            rejected: 'rejected',
        };

        return {
            status: statusMap[data.status] || ('pending' as PaymentStatus),
            metadata: {
                khipu_payment_id: data.payment_id,
                khipu_bank_id: data.bank_id,
                khipu_transfer_date: data.transfer_date,
                khipu_status: data.status,
            },
        };
    }

    async refundPayment(params: {
        payment: Payment;
        config: KhipuConfig;
        amount?: number;
    }) {
        const { payment, config, amount } = params;

        const paymentId = payment.metadata.khipu_payment_id || payment.external_id;
        if (!paymentId) {
            return { success: false };
        }

        const url = `${KHIPU_API_BASE}/payments/${paymentId}/refunds`;
        const authHeader = this.generateAuthHeader(config, 'POST', url);

        try {
            const refundAmount = amount ?? Number(payment.amount);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    amount: String(Math.round(refundAmount)),
                }).toString(),
            });

            if (!response.ok) {
                logger.error(`Khipu refund failed: ${response.status}`);
                return { success: false };
            }

            const data = await response.json();
            return {
                success: true,
                refund_id: `khipu_refund_${data.refund_id || paymentId}`,
            };
        } catch (error) {
            logger.error('Khipu Refund Error:', error);
            return { success: false };
        }
    }
}
