import { NextRequest, NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { withAuth } from '@/lib/api/with-auth'
import { logger } from '@infrastructure/telemetry/StructuredLogger'

/**
 * POST /api/quotations
 * Crea una nueva cotización (crea Order + Quotation desde cliente)
 */
export const POST = withAuth(async (req: NextRequest, _user) => {
    try {
        const body = await req.json()
        logger.info('[Quotations] Creating quotation', { userId: _user.id })

        const container = await getContainer()
        const handler = await container.resolve<any>('CreateQuotationRequestHandler')
        
        const result = await handler.execute({
            clientId: body.clientId || _user.id,
            clientName: body.clientName,
            clientRut: body.clientRut,
            clientEmail: body.clientEmail,
            clientPhone: body.clientPhone,
            serviceId: body.serviceId,
            categoryId: body.categoryId,
            items: body.items || [],
            eventDate: body.eventDate || new Date().toISOString(),
            venueAddress: body.venueAddress,
            eventStartTime: body.eventStartTime,
            eventEndTime: body.eventEndTime,
            mountingTime: body.mountingTime,
            dismountingTime: body.dismountingTime,
            brief: body.brief,
            needsTechnicalVisit: body.needsTechnicalVisit || false,
        })

        if (result.isFailure()) {
            const error = result.getError();
            logger.error('[Quotations] Failed to create', { error: error.message })
            return NextResponse.json({ 
                success: false,
                error: typeof error === 'string' ? error : error.message 
            }, { status: 400 })
        }

        const { quotationId, code } = result.getValue()
        logger.info('[Quotations] Created successfully', { quotationId, code })
        return NextResponse.json({ 
            success: true,
            quotationId,
            code,
            message: "Tu cotización ha sido ingresada correctamente."
        }, { status: 201 })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error('[Quotations] Exception', { error: message, stack: error instanceof Error ? error.stack : undefined })
        return NextResponse.json({ 
            success: false,
            error: message 
        }, { status: 500 })
    }
});
