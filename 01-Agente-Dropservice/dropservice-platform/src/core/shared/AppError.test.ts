import { describe, it, expect } from 'vitest'
import { AppError } from './AppError'

describe('AppError', () => {
  it('should create validation error', () => {
    const error = AppError.validation('Invalid input', [{ field: 'email', message: 'Invalid format' }])
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.httpStatus).toBe(400)
  })

  it('should convert to response format', () => {
    const error = AppError.notFound('Order', '123')
    const response = error.toResponse('trace-id')
    expect(response.code).toBe('NOT_FOUND')
    expect(response.traceId).toBe('trace-id')
    expect(response.timestamp).toBeDefined()
  })
})
