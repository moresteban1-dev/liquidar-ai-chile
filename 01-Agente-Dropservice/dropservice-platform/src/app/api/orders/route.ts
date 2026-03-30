import { NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { logger } from '@infrastructure/telemetry/StructuredLogger'
import { withAuth } from '@/lib/api/with-auth';

/**
 * POST /api/orders
 * Crea una nueva orden (Desde Quotation)
 */
export const POST = withAuth(async (request, _user) => {
    try {
        const body = await request.json()
        const { quotationId } = body

        if (!quotationId) {
            return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 })
        }

        const container = await getContainer()
        const handler = await container.resolve<any>('CreateOrderHandler')
        
        const result = await handler.execute({ quotationId })

        if (result.isErr()) {
            return NextResponse.json({ error: result.error.message }, { status: 400 })
        }

        return NextResponse.json(result.value, { status: 201 })
    } catch (error) {
        logger.error('Error creating order:', error as Error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
});

/**
 * GET /api/orders
 * Lista órdenes (Filtro por provider o client)
 */
export const GET = withAuth(async (request, _user) => {
    try {
        const { searchParams } = new URL(request.url)
        const providerId = searchParams.get('providerId')
        const clientId = searchParams.get('clientId')

        const container = await getContainer()

        if (providerId) {
            const handler = await container.resolve<any>('ListOrdersByProviderHandler')
            const result = await handler.execute({ providerId })
            return NextResponse.json(result.isOk() ? result.value : [])
        }

        if (clientId) {
            const handler = await container.resolve<any>('ListOrdersByClientHandler')
            const result = await handler.execute({ clientId })
            return NextResponse.json(result.isOk() ? result.value : [])
        }

        return NextResponse.json({ error: 'Missing providerId or clientId' }, { status: 400 })
    } catch (error) {
        logger.error('Error listing orders:', error as Error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
});
