// ============================================================
// app/api/payments/manual/confirm/route.ts
// ============================================================

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { UserRole } from '@/core/domain/auth/UserRole';

// Node.js runtime required for crypto module (Khipu gateway)

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticación
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Verificar rol de admin usando perfiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
        }

        const body = await request.json();
        const { payment_id, action, notes } = body;

        if (!payment_id || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Campos inválidos' },
                { status: 400 }
            );
        }

        await PaymentService.confirmManualTransfer(
            payment_id,
            user.id,
            action,
            notes
        );

        return NextResponse.json({
            success: true,
            message: action === 'approve'
                ? 'Pago aprobado exitosamente'
                : 'Pago rechazado',
        });

    } catch (error) {
        logger.error('[Manual Confirm Error]:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}
