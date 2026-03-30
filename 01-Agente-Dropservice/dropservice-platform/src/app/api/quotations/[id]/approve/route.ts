import { NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { logger } from '@infrastructure/telemetry/StructuredLogger'
import { withAuth } from '@/lib/api/with-auth';

export const POST = withAuth(async (_request, _user, params) => {
    try {
        const id = params?.id;
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const container = await getContainer()
        const handler = await container.resolve<any>('ApproveQuotationHandler')
        
        const result = await handler.execute({ quotationId: id })

        if (result.isErr()) {
            return NextResponse.json({ error: result.error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, orderId: result.value.id })
    } catch (error) {
        logger.error('Error approving quotation:', error as Error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
});
