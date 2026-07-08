import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { logger } from '@/infrastructure/telemetry/StructuredLogger';
import { withWebhookAuth } from '@/lib/api/with-auth';
import { createServiceRoleClient } from '@/lib/supabase/api';

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
        logger.error('[Webpay Webhook] CRITICAL: WEBPAY_WEBHOOK_SECRET is not configured. Rejecting all requests for safety.');
        return false; 
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
    } catch (e) {
        logger.error('[Webpay Webhook] Error comparing signatures', e as Error);
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
            try {
                body = JSON.parse(rawBody);
            } catch {
                logger.error('[Webpay Webhook] Malformed JSON payload received');
                return NextResponse.json(
                    { error: 'Invalid JSON payload' },
                    { status: 400 },
                );
            }
        } else {
            // Form data — parse manually
            const params = new URLSearchParams(rawBody);
            body = Object.fromEntries(params.entries());
        }

        // Process Webpay transaction webhook
        if (body.token_ws || body.TBK_TOKEN) {
            const token = (body.token_ws || body.TBK_TOKEN) as string;
            
            // IDEMPOTENCIA AAA: Verificar si el token ya fue procesado con éxito
            const supabase = createServiceRoleClient();
            const { data: existingEvent } = await supabase
                .from('webhook_events')
                .select('id, processed')
                .eq('gateway_slug', 'webpay')
                .eq('payload->>token_ws', token) // Búsqueda profunda en JSONB
                .eq('processed', true)
                .maybeSingle();

            if (existingEvent) {
                // Sanitize token for logging (show only first/last chars)
                const sanitizedToken = token.length > 10
                    ? `${token.slice(0, 4)}...${token.slice(-4)}`
                    : '****';
                logger.info(`[Webpay Webhook] Token ${sanitizedToken} already processed. Skipping duplicated execution.`);
                return NextResponse.json({ received: true, duplicated: true });
            }

            await PaymentService.processWebhook(
                'webpay',
                'transaction.confirmed',
                body,
            );
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        logger.error('[Webpay Webhook] Error processing webhook', error);
        // Return 200 to prevent gateway retries on logic errors
        return NextResponse.json(
            { received: true },
            { status: 200 },
        );
    }
});
