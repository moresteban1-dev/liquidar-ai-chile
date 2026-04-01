import { NextRequest, NextResponse } from 'next/server'
import { AppError } from '@/core/shared/AppError'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'anonymous'
  const path = request.nextUrl.pathname
  const key = `${ip}:${path}`
  const now = Date.now()

  let entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + config.windowMs }
    store.set(key, entry)
  }

  entry.count++
  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  if (!allowed) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    logger.warn('Rate limit exceeded', { key, count: entry.count, limit: config.maxRequests })
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfter }
  }

  return { allowed: true, remaining, resetAt: entry.resetAt }
}

export function withRateLimit(config?: Partial<RateLimitConfig>) {
  const finalConfig = { maxRequests: 60, windowMs: 60000, ...config }

  return function <T extends (...args: any[]) => Promise<NextResponse>>(handler: T): T {
    return (async (...args: any[]) => {
      const request = args[0] as NextRequest
      const result = checkRateLimit(request, finalConfig)

      if (!result.allowed) {
        const error = AppError.rateLimited(result.retryAfter)
        const response = NextResponse.json(error.toResponse(), { status: 429 })
        response.headers.set('Retry-After', String(result.retryAfter))
        return response
      }

      const response = await handler(...args)
      response.headers.set('X-RateLimit-Limit', String(finalConfig.maxRequests))
      response.headers.set('X-RateLimit-Remaining', String(result.remaining))
      return response
    }) as T
  }
}
