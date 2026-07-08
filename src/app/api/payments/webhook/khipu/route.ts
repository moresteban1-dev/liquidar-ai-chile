import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { withWebhookAuth } from '@/lib/api/with-auth';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies Khipu webhook signature using HMAC-SHA256.
 * Khipu sends the signature in the 'x-khipu-signature' header.
 */
function verifyKhipuSignature(
    rawBody: string,
    signature: string | null,
    secret: string | null
): boolean {
    if (!secret) {
        logger.error('[Khipu Webhook] CRITICAL: KHIPU_WEBHOOK_SECRET is not configured. Rejecting all requests for safety.');
        return false;
    }

    if (!signature) {
        logger.warn('[Khipu Webhook] Missing x-khipu-signature header');
        return false;
    }

    const expectedSignature = createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    try {
        return timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex'),
        );
    } catch (e) {
        logger.error('[Khipu Webhook] Error comparing signatures', e as Error);
        return false;
    }
}

export const POST = withWebhookAuth(async (request) => {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-khipu-signature');
        const khipuSecret = process.env.KHIPU_WEBHOOK_SECRET ?? null;

        if (!verifyKhipuSignature(rawBody, signature, khipuSecret)) {
            logger.error('[Khipu Webhook] Invalid signature — rejecting');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 403 }
            );
        }

        let body: Record<string, unknown>;
        try {
            body = JSON.parse(rawBody);
        } catch {
            logger.error('[Khipu Webhook] Malformed JSON payload received');
            return NextResponse.json(
                { error: 'Invalid JSON payload' },
                { status: 400 }
            );
        }

        // Khipu sends notification_token or payment_id
        if (body.payment_id || body.notification_token) {
            await PaymentService.processWebhook(
                'khipu',
                'payment.done',
                body
            );
        }

        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error) {
        logger.error('[Khipu Webhook Error]:', error);
        return NextResponse.json(
            { received: true },
            { status: 200 }
        );
    }
});
