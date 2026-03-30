import { NextRequest, NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { withAuth } from '@/lib/api/with-auth'

/**
 * POST /api/quotations
 * Crea una nueva cotización para una orden
 */
export const POST = withAuth(async (req, _user) => {
    const body = await req.json()
    const container = await getContainer()
    const handler = await container.resolve<any>('CreateQuotationHandler')
    
    const result = await handler.execute(body)

    if (result.isErr()) {
        return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json(result.value, { status: 201 })
});
