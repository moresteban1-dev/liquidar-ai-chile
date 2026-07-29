/**
 * @file route.ts
 * @description Transbank WebpayPlus — Confirm transaction endpoint for Liquidar Platform.
 * GET /api/pagos/webpay/confirm
 *
 * Transbank redirects the user here after completing payment.
 * Confirms the transaction and updates the pago status in Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } from 'transbank-sdk';

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
 * GET /api/pagos/webpay/confirm
 * Query params: token_ws (from Transbank redirect)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token_ws');

  // Transbank sends TBK_TOKEN on user cancellation
  const tbkToken = searchParams.get('TBK_TOKEN');

  // ─── User cancelled ────────────────────────────────────────────────────────
  if (tbkToken && !token) {
    return NextResponse.redirect(
      new URL('/mi-cuenta/pagos?estado=cancelado', req.url),
    );
  }

  if (!token) {
    return NextResponse.redirect(
      new URL('/mi-cuenta/pagos?estado=error&msg=token_faltante', req.url),
    );
  }

  try {
    // ─── Confirm with Transbank ───────────────────────────────────────────────
    const response = await webpayTx.commit(token);

    // response.response_code === 0 means approved
    if (response.response_code !== 0) {
      console.warn('[webpay/confirm] Transacción rechazada:', response.response_code);
      return NextResponse.redirect(
        new URL(`/mi-cuenta/pagos?estado=rechazado&code=${response.response_code}`, req.url),
      );
    }

    // TODO: Update pago status in Supabase to 'completado'
    // const supabase = createServerClient(...);
    // await supabase.from('pagos').update({ estado: 'completado', pagado_at: new Date() })
    //   .eq('webpay_buy_order', response.buy_order);

    console.info('[webpay/confirm] Pago exitoso:', {
      buyOrder: response.buy_order,
      amount: response.amount,
      authCode: response.authorization_code,
    });

    return NextResponse.redirect(
      new URL(`/mi-cuenta/pagos?estado=exitoso&orden=${response.buy_order}`, req.url),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al confirmar pago';
    console.error('[webpay/confirm]', message);
    return NextResponse.redirect(
      new URL('/mi-cuenta/pagos?estado=error', req.url),
    );
  }
}

/**
 * POST /api/pagos/webpay/confirm — health check
 */
export async function POST() {
  return NextResponse.json({ status: 'ok', gateway: 'transbank-webpay-plus', endpoint: 'confirm' });
}
