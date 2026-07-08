// ============================================================
// app/api/payments/webhook/flow/route.ts
// Flow.cl Webhook with HMAC Signature Verification
// ============================================================

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { withWebhookAuth } from '@/lib/api/with-auth';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies Flow webhook signature using HMAC-SHA256.
 * Flow sends the signature in the 'x-flow-signature' header.
 */
function verifyFlowSignature(
    rawBody: string,
    signature: string | null,
    secretKey: string | null
): boolean {
    if (!secretKey) {
        logger.error('[Flow Webhook] CRITICAL: FLOW_WEBHOOK_SECRET is not configured. Rejecting all requests for safety.');
        return false;
    }

    if (!signature) {
        logger.warn('[Flow Webhook] Missing x-flow-signature header');
        return false;
    }

    const expectedSignature = createHmac('sha256', secretKey)
        .update(rawBody)
        .digest('hex');

    try {
        return timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex'),
        );
    } catch (e) {
        logger.error('[Flow Webhook] Error comparing signatures', e as Error);
        return false;
    }
}

export const POST = withWebhookAuth(async (request) => {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-flow-signature');
        const flowSecret = process.env.FLOW_WEBHOOK_SECRET ?? null;

        if (!verifyFlowSignature(rawBody, signature, flowSecret)) {
            logger.error('[Flow Webhook] Invalid signature — rejecting');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 403 }
            );
        }

        let body: Record<string, unknown>;
        try {
            body = JSON.parse(rawBody);
        } catch {
            logger.error('[Flow Webhook] Malformed JSON payload received');
            return NextResponse.json(
                { error: 'Invalid JSON payload' },
                { status: 400 }
            );
        }

        // Flow sends token in webhook confirmation
        if (body.token || body.flowOrder) {
            await PaymentService.processWebhook(
                'flow',
                'payment.confirmed',
                body
            );
        }

        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error) {
        logger.error('[Flow Webhook Error]:', error);
        return NextResponse.json(
          // Always return 200 to webhooks to avoid retries on logic errors, but log them
            { received: true },
            { status: 200 }
        );
    }
});
