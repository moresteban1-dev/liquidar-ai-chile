import { NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { logger } from '@infrastructure/telemetry/StructuredLogger'
import { withAuth } from '@/lib/api/with-auth';

export const POST = withAuth(async (request, _user, params) => {
    try {
        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const body = await request.json()
        const container = await getContainer()
        const handler = await container.resolve<any>('QuotationTransitionHandler')
        
        const result = await handler.execute({ 
            id, 
            newStatus: body.newStatus,
            metadata: body.metadata 
        })

        if (result.isErr()) {
            return NextResponse.json({ error: result.error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, quotation: result.value })
    } catch (error) {
        logger.error('Error transitioning quotation state:', error as Error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
});
