import { NextResponse } from 'next/server'
import { z } from 'zod'
import { featureFlags } from '@/infrastructure/feature-flags/FeatureFlags'
import { withAdmin } from '@/lib/api/with-auth'
import { handleError } from '@/infrastructure/http/middleware/errorHandler'

export const dynamic = 'force-dynamic'

const UpdateFlagSchema = z.object({
  flagName: z.string().min(1),
  percentage: z.number().min(0).max(100)
})

/**
 * GET /api/admin/feature-flags
 * 
 * Lista todos los feature flags (admin only)
 */
export const GET = withAdmin(
  async (_request, _user) => {
    try {
      const flags = featureFlags.getAllFlags()

      return NextResponse.json({
        flags,
        total: flags.length
      })

    } catch (error) {
      return handleError(error)
    }
  }
)

/**
 * PATCH /api/admin/feature-flags
 * 
 * Actualiza porcentaje de un flag (admin only)
 */
export const PATCH = withAdmin(
  async (request, _user) => {
    try {
      const body = await request.json()
      const validatedData = UpdateFlagSchema.parse(body)

      const flag = featureFlags.getFlag(validatedData.flagName)

      if (!flag) {
        return NextResponse.json(
          { error: `Flag '${validatedData.flagName}' not found` },
          { status: 404 }
        )
      }

      featureFlags.setPercentage(
        validatedData.flagName,
        validatedData.percentage
      )

      const updatedFlag = featureFlags.getFlag(validatedData.flagName)

      return NextResponse.json({
        flag: updatedFlag,
        message: `Flag '${validatedData.flagName}' updated to ${validatedData.percentage}%`
      })

    } catch (error) {
      return handleError(error)
    }
  }
)
