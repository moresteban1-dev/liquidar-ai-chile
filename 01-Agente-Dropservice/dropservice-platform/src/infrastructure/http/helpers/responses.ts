import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  error: ApiError | null
  meta: ApiMeta | null
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ApiMeta {
  total?: number
  limit?: number
  offset?: number
  page?: number
  totalPages?: number
}

export function ok<T>(data: T, meta?: ApiMeta): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    error: null,
    meta: meta ?? null,
    timestamp: new Date().toISOString()
  }, { status: 200 })
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    error: null,
    meta: null,
    timestamp: new Date().toISOString()
  }, { status: 201 })
}

export function badRequest(message: string, code = 'BAD_REQUEST', details?: Record<string, unknown>): NextResponse<ApiResponse<never>> {
  return errorResponse(code, message, 400, details)
}

export function unauthorized(message = 'Unauthorized'): NextResponse<ApiResponse<never>> {
  return errorResponse('UNAUTHORIZED', message, 401)
}

export function forbidden(message = 'Forbidden'): NextResponse<ApiResponse<never>> {
  return errorResponse('FORBIDDEN', message, 403)
}

export function notFound(message = 'Resource not found'): NextResponse<ApiResponse<never>> {
  return errorResponse('NOT_FOUND', message, 404)
}

export function internalError(message = 'Internal server error'): NextResponse<ApiResponse<never>> {
  return errorResponse('INTERNAL_ERROR', message, 500)
}

export const internalServerError = internalError;

function errorResponse(code: string, message: string, status: number, details?: Record<string, unknown>): NextResponse<ApiResponse<never>> {
  return NextResponse.json({
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details && process.env.NODE_ENV !== 'production' ? { details } : {})
    },
    meta: null,
    timestamp: new Date().toISOString()
  }, { status })
}
