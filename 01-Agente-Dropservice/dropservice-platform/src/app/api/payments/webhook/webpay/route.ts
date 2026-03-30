// ============================================================
// app/api/payments/webhook/webpay/route.ts
// ============================================================

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { withWebhookAuth } from '@/lib/api/with-auth';

// Node.js runtime required for crypto module (Khipu gateway)

export const POST = withWebhookAuth(async (request) => {
    try {
        const formData = await request.formData();
        const tokenWs = formData.get('token_ws') as string;
        const tbkToken = formData.get('TBK_TOKEN') as string;

        // Si viene TBK_TOKEN, el usuario anuló el pago en el formulario de Webpay
        if (tbkToken) {
            // Redirigir a página de cancelación
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel?reason=user_cancelled`
            );
        }

        if (!tokenWs) {
            return NextResponse.json({ error: 'No token' }, { status: 400 });
        }

        // Procesar la respuesta de Webpay (Commit)
        await PaymentService.processWebhook(
            'webpay',
            'commit',
            { token_ws: tokenWs }
        );

        // Redirigir al usuario a la página de resultado
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?token=${tokenWs}`
        );

    } catch (error) {
        logger.error('[Webpay Webhook Error]:', error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/payments/error`
        );
    }
});

// Webpay también puede enviar GET en algunos flujos de anulación
export const GET = withWebhookAuth(async (request) => {
    const { searchParams } = new URL(request.url);
    const tokenWs = searchParams.get('token_ws');

    if (tokenWs) {
        try {
            await PaymentService.processWebhook(
                'webpay',
                'commit',
                { token_ws: tokenWs }
            );
        } catch (error) {
            logger.error('[Webpay GET Error]:', error);
        }
    }

    // Si no hay token, o falló, redirigir
    return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?token=${tokenWs || ''}`
    );
});
