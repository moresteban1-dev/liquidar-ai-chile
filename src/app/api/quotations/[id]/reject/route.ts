import { NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { logger } from '@infrastructure/telemetry/StructuredLogger'
import { withAuth } from '@/lib/api/with-auth';

export const POST = withAuth(async (request, _user, params) => {
    try {
        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const { reason } = await request.json()
        const container = await getContainer()
        const handler = await container.resolve<any>('RejectQuotationHandler')
        
        const result = await handler.execute({ id, reason })

        if (result.isErr()) {
            return NextResponse.json({ error: result.error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        logger.error('Error rejecting quotation:', error as Error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
});
