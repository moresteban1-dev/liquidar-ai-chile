import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/di/bindings'
import { TransitionOrderStateHandler } from '@/core/application/handlers/TransitionOrderStateHandler'
import { UpdateOrderStateSchema } from '@/infrastructure/http/validators/OrderValidators'
import { withAuth, AuthenticatedUser } from '@/infrastructure/http/middleware/RBACMiddleware'
import { handleError } from '@/infrastructure/http/middleware/errorHandler'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

/**
 * PATCH /api/orders/[id]/state
 * 
 * Cambia el estado de una orden.
 * Requiere autenticación Bearer Token.
 * Los permisos específicos por rol se validan en el TransitionOrderStateHandler.
 */
export const PATCH = withAuth<{ id: string }>(
  async (
    request: NextRequest,
    { params, user }: { params: Promise<{ id: string }>; user: AuthenticatedUser }
  ) => {
    try {
      const { id } = await params

      logger.info('Solicitud de cambio de estado de orden recibida', {
        orderId: id,
        userId: user.id,
        role: user.role
      })

      // 1. Validar el cuerpo de la petición con Zod
      const body = await request.json()
      const validatedData = UpdateOrderStateSchema.parse(body)

      // 2. Resolver el Handler desde el contenedor de DI (bindings.ts)
      const handler = container.resolve<TransitionOrderStateHandler>(
        'TransitionOrderStateHandler'
      )

      // 3. Ejecutar el caso de uso con el contexto del usuario autenticado
      const result = await handler.execute({
        orderId: id,
        newState: validatedData.newState,
        reason: validatedData.reason,
        performedBy: user.id,
        performedByRole: user.role
      })

      // 4. Transformar resultado del dominio a respuesta HTTP
      if (result.isFailure()) {
        const status = result.error.includes('no encontrada') ? 404
          : result.error.includes('no tiene permiso') ? 403
          : 400

        return NextResponse.json(
          { error: result.error },
          { status }
        )
      }

      const order = result.value

      return NextResponse.json({
        id: order.orderId.toString(),
        state: order.state,
        isActive: order.isActive,
        updatedAt: order.updatedAt.toISOString(),
        message: `Orden transicionada exitosamente a ${order.state}`
      })

    } catch (error) {
      // Delegar manejo de errores genéricos (Zod, Parse, etc.) al middleware centralizado
      return handleError(error)
    }
  }
)
