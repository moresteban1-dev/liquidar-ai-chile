// ============================================================
// app/api/payments/gateways/route.ts
// ============================================================

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { withAuth } from '@/lib/api/with-auth';

// Node.js runtime required for crypto module (Khipu gateway)

export const GET = withAuth(async (_request, _user) => {
    try {
        const gateways = await PaymentService.getActiveGateways();
        return NextResponse.json({ gateways });
    } catch (error) {
        logger.error('Error fetching active gateways:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
});
