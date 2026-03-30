import { NextRequest, NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { logger } from '@infrastructure/telemetry/StructuredLogger'
import { withAuth } from '@/lib/api/with-auth';

/**
 * GET /api/quotations/[id]
 */
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const container = await getContainer()
    const repository = await container.resolve<any>('QuotationRepository')
    const quotation = await repository.getById(id)

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error) {
    logger.error('Error fetching quotation:', error as Error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
});

/**
 * PATCH /api/quotations/[id]
 */
export const PATCH = withAuth(async (request, _user, params) => {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const body = await request.json()
    const container = await getContainer()
    const handler = await container.resolve<any>('UpdateQuotationHandler')
    
    const result = await handler.execute({ id, ...body })

    if (result.isErr()) {
        return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json(result.value)
  } catch (error) {
    logger.error('Error updating quotation:', error as Error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
});
