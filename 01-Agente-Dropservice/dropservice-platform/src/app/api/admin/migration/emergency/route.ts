import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rolloutController } from '@/infrastructure/migration/RolloutController'
import { withAdmin } from '@/lib/api/with-auth'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

const EmergencySchema = z.object({
  flagName: z.string().min(1),
  reason: z.string().min(10, 'Reason must be at least 10 characters')
})

/**
 * POST /api/admin/migration/emergency
 * 
 * Emergency rollback a 0% inmediato
 */
export const POST = withAdmin(
  async (request, user) => {
    try {
      const body = await request.json()
      const validatedData = EmergencySchema.parse(body)

      logger.error('EMERGENCY ROLLBACK triggered', new Error(validatedData.reason), {
        flagName: validatedData.flagName,
        adminId: user.id
      })

      rolloutController.emergencyRollback(
        validatedData.flagName,
        `Emergency rollback by ${user.id}: ${validatedData.reason}`
      )

      return NextResponse.json({
        message: `Emergency rollback executed for ${validatedData.flagName}`,
        newPercentage: 0,
        triggeredBy: user.id,
        reason: validatedData.reason,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error in emergency rollback API:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
)
