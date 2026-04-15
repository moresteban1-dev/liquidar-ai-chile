export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  STATE_TRANSITION_ERROR: 'STATE_TRANSITION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED'
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export interface AppErrorResponse {
  code: ErrorCode
  message: string
  details?: ErrorDetail[]
  timestamp: string
  traceId?: string
}

export interface ErrorDetail {
  field?: string
  message: string
  value?: unknown
}

export class AppError {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly httpStatus: number,
    public readonly details?: ErrorDetail[],
    public readonly isOperational: boolean = true
  ) {}

  static validation(message: string, details?: ErrorDetail[]): AppError {
    return new AppError('VALIDATION_ERROR', message, 400, details)
  }

  static notFound(resource: string, id?: string): AppError {
    const msg = id ? `${resource} with ID '${id}' not found` : `${resource} not found`
    return new AppError('NOT_FOUND', msg, 404)
  }

  static unauthorized(message: string = 'Authentication required'): AppError {
    return new AppError('UNAUTHORIZED', message, 401)
  }

  static forbidden(message: string = 'Insufficient permissions'): AppError {
    return new AppError('FORBIDDEN', message, 403)
  }

  static businessRule(message: string): AppError {
    return new AppError('BUSINESS_RULE_VIOLATION', message, 422)
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError('INTERNAL_ERROR', message, 500)
  }

  static infrastructure(message: string): AppError {
    return new AppError('INTERNAL_ERROR', message, 503)
  }

  static rateLimited(retryAfter?: number): AppError {
    const msg = retryAfter ? `Rate limited. Retry after ${retryAfter} seconds` : 'Too many requests'
    return new AppError('RATE_LIMITED', msg, 429)
  }

  static business(message: string, _details?: ErrorDetail[]): AppError {
    return this.businessRule(message)
  }

  static from(error: unknown): AppError {
    if (error instanceof AppError) return error
    if (error instanceof Error) return new AppError('UNEXPECTED_ERROR', error.message, 500)
    return new AppError('UNKNOWN_ERROR', String(error), 500)
  }

  public toString(): string {
    return `[${this.code}] ${this.message}`
  }

  public toResponse(traceId?: string): AppErrorResponse {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
      traceId
    }
  }
}
