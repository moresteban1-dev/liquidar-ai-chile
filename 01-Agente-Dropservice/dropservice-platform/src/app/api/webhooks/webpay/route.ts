import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { withWebhookAuth } from '@/lib/api/with-auth';

/**
 * Verifies Webpay webhook signature using HMAC-SHA256.
 * Transbank sends a custom header 'tbk-signature' with the HMAC of the body.
 * 
 * In production, WEBPAY_WEBHOOK_SECRET must be configured for integrity checks.
 */
function verifyWebpaySignature(
    rawBody: string,
    signature: string | null,
    secret: string | null,
): boolean {
    if (!secret) {
        logger.warn('[Webpay Webhook] No WEBPAY_WEBHOOK_SECRET configured — skipping verification');
        return true; // Allow in dev without secret
    }

    if (!signature) {
        logger.warn('[Webpay Webhook] Missing tbk-signature header');
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
    } catch {
        return false;
    }
}

export const POST = withWebhookAuth(async (request) => {
    try {
        const contentType = request.headers.get('content-type') || '';
        const rawBody = await request.text();
        const signature = request.headers.get('tbk-signature');
        const webpaySecret = process.env.WEBPAY_WEBHOOK_SECRET ?? null;

        if (!verifyWebpaySignature(rawBody, signature, webpaySecret)) {
            logger.error('[Webpay Webhook] Invalid signature — rejecting');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 403 },
            );
        }

        // Parse body based on content type
        let body: Record<string, unknown>;
        if (contentType.includes('application/json')) {
            body = JSON.parse(rawBody);
        } else {
            // Form data — parse manually
            const params = new URLSearchParams(rawBody);
            body = Object.fromEntries(params.entries());
        }

        // Process Webpay transaction webhook
        if (body.token_ws || body.TBK_TOKEN) {
            await PaymentService.processWebhook(
                'webpay',
                'transaction.confirmed',
                body,
            );
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        logger.error('[Webpay Webhook] Error processing webhook', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        );
    }
});
