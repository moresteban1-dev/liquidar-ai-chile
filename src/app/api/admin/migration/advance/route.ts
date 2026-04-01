import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rolloutController } from '@/infrastructure/migration/RolloutController'
import { withAdmin } from '@/lib/api/with-auth'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

const AdvanceSchema = z.object({
  flagName: z.string().min(1),
  endpoint: z.string().min(1)
})

const RollbackSchema = z.object({
  flagName: z.string().min(1),
  reason: z.string().min(1).optional()
})

/**
 * POST /api/admin/migration/advance
 * 
 * Avanza al siguiente paso del rollout
 */
export const POST = withAdmin(
  async (request, user) => {
    try {
      const body = await request.json()
      const validatedData = AdvanceSchema.parse(body)

      logger.info('Migration advance requested', {
        flagName: validatedData.flagName,
        endpoint: validatedData.endpoint,
        adminId: user.id
      })

      const result = rolloutController.advance(
        validatedData.flagName,
        validatedData.endpoint
      )

      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        message: result.message,
        newPercentage: result.newPercentage,
        status: rolloutController.getStatus(
          validatedData.flagName,
          validatedData.endpoint
        )
      })

    } catch (error) {
      console.error('Error in migration advance:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
)

/**
 * PUT /api/admin/migration/advance (ROLLBACK)
 * 
 * Rollback al paso anterior
 */
export const PUT = withAdmin(
  async (request, user) => {
    try {
      const body = await request.json()
      const validatedData = RollbackSchema.parse(body)

      logger.warn('Migration rollback requested', {
        flagName: validatedData.flagName,
        reason: validatedData.reason,
        adminId: user.id
      })

      const result = rolloutController.rollback(validatedData.flagName)

      return NextResponse.json({
        message: result.message,
        newPercentage: result.newPercentage
      })

    } catch (error) {
      console.error('Error in migration rollback:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
)
