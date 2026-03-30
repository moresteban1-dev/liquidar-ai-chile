import { NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { logger } from '@infrastructure/telemetry/StructuredLogger'
import { withAuth } from '@/lib/api/with-auth';

export const POST = withAuth(async (_request, _user, params) => {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const container = await getContainer()
    const handler = await container.resolve<any>('SubmitQuotationHandler')
    
    // El handler se encarga de cambiar el status a 'PENDING' y disparar los eventos
    const result = await handler.execute({ id })

    if (result.isErr()) {
        return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, quotation: result.value })
  } catch (error) {
    logger.error('Error submitting quotation:', error as Error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
});
