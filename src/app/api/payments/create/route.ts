import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { validateRequestBody } from '@/lib/validators/api-validator';
import { CreatePaymentSchema } from '@/lib/validators/api-schemas';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { withRateLimit } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
    // 🛡️ API Rate Limiting: 5 intentos por IP cada minuto
    const rateLimitResponse = await withRateLimit(request, 'payment-create', { limit: 5, windowMs: 60000 });
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const supabase = await createClient();

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const validation = await validateRequestBody(request, CreatePaymentSchema);
        if (!validation.success) return validation.response;
        const body = validation.data;

        const result = await PaymentService.createPayment(user.id, body as Parameters<typeof PaymentService.createPayment>[1]);

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        logger.error('[Payment Create Error]:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}
