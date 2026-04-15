import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { checkRateLimit } from './RateLimiter'

describe('RateLimiter', () => {
  it('should allow requests under limit', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: new Headers({ 'x-forwarded-for': '127.0.0.1' })
    })
    const result = checkRateLimit(req, { maxRequests: 2, windowMs: 60000 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(1)
  })

  it('should block requests over limit', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: new Headers({ 'x-forwarded-for': '127.0.0.2' })
    })
    const config = { maxRequests: 1, windowMs: 60000 }
    checkRateLimit(req, config)
    const result = checkRateLimit(req, config)
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })
})
