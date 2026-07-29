/**
 * @file route.ts
 * @description Khipu — Verify webhook endpoint for Liquidar Platform.
 * POST /api/pagos/khipu/verify
 *
 * Receives Khipu notification (IPN) when a payment is completed.
 * Updates pago status in Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const KHIPU_SECRET = process.env.KHIPU_SECRET ?? '';

/**
 * Verifies the Khipu HMAC signature.
 * See: https://khipu.com/page/api-referencia#notificacion
 */
function verifyKhipuSignature(body: string, signature: string | null): boolean {
  if (!signature || !KHIPU_SECRET) return false;
  const hmac = crypto.createHmac('sha256', KHIPU_SECRET);
  hmac.update(body);
  const expected = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

/**
 * POST /api/pagos/khipu/verify
 * Called by Khipu's IPN when payment is completed.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-khipu-signature');

    // ─── Verify signature ──────────────────────────────────────────────────────
    if (!verifyKhipuSignature(rawBody, signature)) {
      console.warn('[khipu/verify] Invalid signature');
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }

    const params = new URLSearchParams(rawBody);
    const paymentId = params.get('payment_id');
    const transactionId = params.get('transaction_id'); // Our pagoId
    const status = params.get('status');
    const amount = params.get('amount');

    console.info('[khipu/verify] Notification received:', {
      paymentId,
      transactionId,
      status,
      amount,
    });

    if (status === 'done' && transactionId) {
      // TODO: Update pago in Supabase
      // const supabase = createServerClient(...);
      // await supabase.from('pagos').update({
      //   estado: 'completado',
      //   khipu_payment_id: paymentId,
      //   pagado_at: new Date(),
      // }).eq('id', transactionId);
    }

    // Khipu expects a 200 response to confirm receipt
    return NextResponse.json({ status: 'received' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al procesar notificación Khipu';
    console.error('[khipu/verify]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/pagos/khipu/verify — health check
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', gateway: 'khipu', endpoint: 'verify' });
}
