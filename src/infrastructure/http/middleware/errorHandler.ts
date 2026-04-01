import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError, ErrorDetail } from '@/core/shared/AppError'
import { getTraceId } from '@/infrastructure/telemetry/Tracer'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

export function handleError(error: unknown): NextResponse {
  const traceId = getTraceId()

  if (error instanceof ZodError) {
    const details: ErrorDetail[] = error.issues.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }))
    const appError = AppError.validation('Validation failed', details)
    logger.warn('Validation error', { details: appError.details })
    return NextResponse.json(appError.toResponse(traceId), { status: appError.httpStatus })
  }

  if (error instanceof AppError) {
    if (error.httpStatus >= 500) {
      logger.error('Application error', new Error(error.message), { code: error.code })
    } else {
      logger.warn('Client error', { code: error.code, message: error.message })
    }
    return NextResponse.json(error.toResponse(traceId), { status: error.httpStatus })
  }

  if (typeof error === 'string') {
    const appError = AppError.businessRule(error)
    return NextResponse.json(appError.toResponse(traceId), { status: appError.httpStatus })
  }

  logger.error('Unexpected error', error as Error)
  const internalError = AppError.internal()
  return NextResponse.json(internalError.toResponse(traceId), { status: 500 })
}
