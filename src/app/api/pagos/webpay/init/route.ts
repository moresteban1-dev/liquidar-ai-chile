/**
 * @file route.ts
 * @description Transbank WebpayPlus — Init transaction endpoint for Liquidar Platform.
 * POST /api/pagos/webpay/init
 *
 * Initiates a WebpayPlus transaction for a winning bid payment.
 * Returns the redirect URL and token to send the user to Transbank.
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } from 'transbank-sdk';

const WEBPAY_RETURN_URL =
  (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000') + '/api/pagos/webpay/confirm';

const webpayTx = process.env.NODE_ENV === 'production'
  ? new WebpayPlus.Transaction(
      new Options(
        process.env.TRANSBANK_COMMERCE_CODE!,
        process.env.TRANSBANK_API_KEY!,
        Environment.Production,
      ),
    )
  : new WebpayPlus.Transaction(
      new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration),
    );

/**
 * POST /api/pagos/webpay/init
 * Body: { loteId: string, montoClp: number, pagoId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { loteId?: string; montoClp?: number; pagoId?: string };
    const { loteId, montoClp, pagoId } = body;

    // ─── Input validation ──────────────────────────────────────────────────────
    if (!loteId || typeof loteId !== 'string') {
      return NextResponse.json({ error: 'loteId es requerido' }, { status: 400 });
    }
    if (!montoClp || typeof montoClp !== 'number' || montoClp <= 0) {
      return NextResponse.json({ error: 'montoClp debe ser un número positivo' }, { status: 400 });
    }
    if (!pagoId || typeof pagoId !== 'string') {
      return NextResponse.json({ error: 'pagoId es requerido' }, { status: 400 });
    }

    // ─── Create transaction ────────────────────────────────────────────────────
    const buyOrder = `LIQ-${pagoId.slice(0, 8).toUpperCase()}`;
    const sessionId = `sess-${Date.now()}`;

    const response = await webpayTx.create(
      buyOrder,
      sessionId,
      montoClp,
      WEBPAY_RETURN_URL,
    );

    return NextResponse.json({
      token: response.token,
      url: response.url,
      buyOrder,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno al iniciar pago';
    console.error('[webpay/init]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/pagos/webpay/init — health check
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', gateway: 'transbank-webpay-plus' });
}
