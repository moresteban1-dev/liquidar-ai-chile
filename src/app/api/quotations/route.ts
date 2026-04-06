import { NextRequest, NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { withAuth } from '@/lib/api/with-auth'

/**
 * POST /api/quotations
 * Crea una nueva cotización (crea Order + Quotation desde cliente)
 */
export const POST = withAuth(async (req: NextRequest, _user) => {
    const body = await req.json()
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
        return NextResponse.json({ 
            success: false,
            error: typeof error === 'string' ? error : error.message 
        }, { status: 400 })
    }

    const { quotationId, code } = result.getValue()
    return NextResponse.json({ 
        success: true,
        quotationId,
        code,
        message: "Tu cotización ha sido ingresada correctamente."
    }, { status: 201 })
});
