/**
 * @file route.ts
 * @description Khipu — Create payment endpoint for Liquidar Platform.
 * POST /api/pagos/khipu/create
 *
 * Creates a Khipu payment link for a winning bid.
 * Returns the payment URL to redirect the user.
 */

import { NextRequest, NextResponse } from 'next/server';

const KHIPU_API_URL = 'https://khipu.com/api/2.0/payments';
const KHIPU_RECEIVER_ID = process.env.KHIPU_RECEIVER_ID ?? '';
const KHIPU_SECRET = process.env.KHIPU_SECRET ?? '';

/**
 * POST /api/pagos/khipu/create
 * Body: { loteId: string, montoClp: number, pagoId: string, email: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      loteId?: string;
      montoClp?: number;
      pagoId?: string;
      email?: string;
      descripcion?: string;
    };
    const { loteId, montoClp, pagoId, email, descripcion } = body;

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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    // ─── Khipu API v2 request ──────────────────────────────────────────────────
    const params = new URLSearchParams({
      receiver_id: KHIPU_RECEIVER_ID,
      subject: descripcion ?? `Pago lote Liquidar #${loteId.slice(0, 8)}`,
      amount: String(montoClp),
      currency: 'CLP',
      transaction_id: pagoId,
      return_url: `${baseUrl}/mi-cuenta/pagos?estado=exitoso`,
      cancel_url: `${baseUrl}/mi-cuenta/pagos?estado=cancelado`,
      notify_url: `${baseUrl}/api/pagos/khipu/verify`,
      ...(email ? { payer_email: email } : {}),
    });

    const response = await fetch(KHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `${KHIPU_RECEIVER_ID}:${KHIPU_SECRET}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[khipu/create] API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Error al crear pago Khipu', details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json() as { payment_id: string; payment_url: string; simplified_transfer_url: string };

    return NextResponse.json({
      paymentId: data.payment_id,
      paymentUrl: data.payment_url,
      simplifiedUrl: data.simplified_transfer_url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno al crear pago Khipu';
    console.error('[khipu/create]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/pagos/khipu/create — health check
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', gateway: 'khipu' });
}
