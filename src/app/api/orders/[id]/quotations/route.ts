import { NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/di/Container';
import { logger } from '@/infrastructure/telemetry/StructuredLogger';
import { withAuth } from '@/lib/api/with-auth';
import { ListQuotationsByOrderHandler } from '@/core/application/handlers/ListQuotationsByOrderHandler';
import { UserRole } from '@/core/domain/auth/UserRole';
 export const GET = withAuth(async (_request, user, params) => {
   try {
     const id = params?.id;
     if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
 
     logger.info('GET /api/orders/[id]/quotations', { orderId: id, userId: user.id, role: user.role });
 
     const container = await getContainer();
     const handler = await container.resolve<ListQuotationsByOrderHandler>(
       'ListQuotationsByOrderHandler'
     );

    const result = await handler.execute({
      orderId: id
    });

    if (result.isFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    const quotations = result.unwrap();

    // Role-based data shaping
    const mappedQuotations = quotations.map(q => {
      if (user.role === UserRole.CLIENT) {
        return {
          ...q,
          pricing: {
            finalPrice: (q as any).pricing?.finalPrice,
            currency: (q as any).pricing?.currency,
          }
        };
      }

      if (user.role === UserRole.VENDOR) {
        if ((q as any).providerId !== user.id) return null;
        return {
          ...q,
          pricing: {
            providerCost: (q as any).pricing?.providerCost,
            currency: (q as any).pricing?.currency,
          }
        };
      }

      return q; // Admin sees everything
    }).filter(item => item !== null);

    return NextResponse.json(mappedQuotations);

  } catch (error) {
    logger.error('[Quotations List API] Error:', error as Error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
