import { NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { DeleteOrderHandler } from '@/core/application/handlers/DeleteOrderHandler'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'
import { withAuth } from '@/lib/api/with-auth';

/**
 * DELETE /api/orders/[id]
 * 
 * Soft-delete de una orden.
 */
export const DELETE = withAuth(async (request, user, params) => {
  try {
    const orderId = params?.id;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || undefined

    const container = await getContainer();
    const handler = await container.resolve<DeleteOrderHandler>('DeleteOrderHandler')
    
    const result = await handler.execute({
      orderId,
      performedBy: user.id,
      performedByRole: (user.role.toLowerCase() === 'admin' ? 'admin' : 'client') as 'admin'|'client',
      reason
    })

    if (result.isFailure()) {
      return NextResponse.json(
        { error: result.getError() },
        { status: result.getError().message.toLowerCase().includes('not found') ? 404 : 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('API Error in DELETE /api/orders/[id]', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});
