// ============================================================
// app/api/cron/expire-payments/route.ts
// Se ejecuta cada hora vía Vercel Cron
// ============================================================

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withInternalAuth } from '@/lib/api/with-auth';

export const runtime = 'nodejs';

export const GET = withInternalAuth(async () => {
    // Forensic Fix: await createClient is required
    const supabaseClient = await createClient();

    // Expirar pagos pendientes que pasaron su fecha de expiración
    const { data: expired, error } = await supabaseClient
        .from('payments')
        .update({ status: 'expired' })
        .in('status', ['pending', 'pending_review', 'processing'])
        .lt('expires_at', new Date().toISOString())
        .select('id');

    if (error) {
        logger.error('[Cron] Error expirando pagos:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Crear logs para cada pago expirado
    if (expired && expired.length > 0) {
        const logs = expired.map((p) => ({
            payment_id: p.id,
            action: 'auto_expired',
            new_status: 'expired',
            details: { reason: 'Tiempo de pago expirado' },
        }));

        await supabaseClient.from('payment_logs').insert(logs);
    }

    return NextResponse.json({
        expired_count: expired?.length || 0,
        timestamp: new Date().toISOString(),
    });
});
