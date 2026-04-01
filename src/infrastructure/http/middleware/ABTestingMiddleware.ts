import { NextRequest, NextResponse } from 'next/server'
import { featureFlags } from '@/infrastructure/feature-flags/FeatureFlags'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

/**
 * A/B Testing Middleware
 * 
 * Rutea requests entre v1 (legacy) y v2 (new architecture)
 * basándose en feature flags
 */

export interface ABTestContext {
  version: 'v1' | 'v2'
  flagName: string
  userId?: string | null | undefined
  isLegacyFormat: boolean
}

/**
 * Determina qué versión usar para un request
 */
export function determineVersion(
  request: NextRequest,
  flagName: string
): ABTestContext {
  // 1. Check force header (para testing)
  const forceVersion = request.headers.get('x-api-version')
  if (forceVersion === 'v2' || forceVersion === 'v1') {
    return {
      version: forceVersion,
      flagName,
      userId: request.headers.get('x-user-id') || undefined,
      isLegacyFormat: false
    }
  }

  // 2. Extract userId from auth header
  const userId = extractUserIdFromRequest(request)

  // 3. Check feature flag
  const useV2 = featureFlags.isEnabled(flagName, {
    userId,
    headers: request.headers
  })

  return {
    version: useV2 ? 'v2' : 'v1',
    flagName,
    userId,
    isLegacyFormat: false
  }
}

/**
 * Middleware wrapper para A/B testing
 */
export function withABTest(
  flagName: string,
  v2Handler: (request: NextRequest) => Promise<NextResponse>,
  v1Handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const context = determineVersion(request, flagName)

    logger.info('A/B Test routing', {
      flagName,
      version: context.version,
      userId: context.userId,
      path: request.nextUrl.pathname
    })

    const startTime = Date.now()

    try {
      const response = context.version === 'v2'
        ? await v2Handler(request)
        : await v1Handler(request)

      const duration = Date.now() - startTime

      // Agregar headers de debug
      response.headers.set('x-api-version', context.version)
      response.headers.set('x-response-time', `${duration}ms`)

      // Log para métricas de A/B testing
      logger.info('A/B Test response', {
        flagName,
        version: context.version,
        status: response.status,
        duration,
        path: request.nextUrl.pathname
      })

      return response

    } catch (error) {
      const duration = Date.now() - startTime

      logger.error('A/B Test error', error as Error, {
        flagName,
        version: context.version,
        duration,
        path: request.nextUrl.pathname
      })

      throw error
    }
  }
}

/**
 * Extrae userId del JWT token (simplified)
 */
function extractUserIdFromRequest(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined
  }

  try {
    const token = authHeader.substring(7)
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return undefined
    
    // Decode JWT payload (sin verificar - solo para routing)
    const payload = JSON.parse(
      Buffer.from(payloadPart, 'base64').toString()
    )
    return payload.sub || payload.user_id
  } catch {
    return undefined
  }
}
