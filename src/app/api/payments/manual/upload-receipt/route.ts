// ============================================================
// app/api/payments/manual/upload-receipt/route.ts
// ============================================================

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentService } from '@/lib/payments/payment-service';

// Node.js runtime required for crypto module (Khipu gateway)

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verificar autenticación
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const paymentId = formData.get('payment_id') as string;
        const file = formData.get('receipt') as File;
        const senderName = formData.get('sender_name') as string;
        const senderRut = formData.get('sender_rut') as string;
        const senderBank = formData.get('sender_bank') as string;
        const transferDate = formData.get('transfer_date') as string;

        if (!paymentId || !file || !senderName || !senderRut || !senderBank || !transferDate) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            );
        }

        await PaymentService.uploadReceipt(
            paymentId,
            user.id,
            file,
            {
                sender_name: senderName,
                sender_rut: senderRut,
                sender_bank: senderBank,
                transfer_date: transferDate,
            }
        );

        return NextResponse.json({ success: true, message: 'Comprobante subido correctamente' });

    } catch (error) {
        logger.error('[Upload Receipt Error]:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}
