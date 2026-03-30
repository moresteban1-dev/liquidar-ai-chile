import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { withWebhookAuth } from '@/lib/api/with-auth';
import { createHmac } from 'crypto';

/**
 * Verifies Khipu webhook signature using HMAC-SHA256.
 * Khipu sends the signature in the 'x-khipu-signature' header.
 */
function verifyKhipuSignature(
    rawBody: string,
    signature: string | null,
    secret: string | null
): boolean {
    if (!signature || !secret) {
        logger.warn('[Khipu Webhook] Missing signature or secret — skipping verification in dev');
        return !secret; // Allow if no secret configured (dev mode)
    }

    const expectedSignature = createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    return signature === expectedSignature;
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

        const body = JSON.parse(rawBody);

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
            { received: true, error: (error as Error).message },
            { status: 200 }
        );
    }
});
