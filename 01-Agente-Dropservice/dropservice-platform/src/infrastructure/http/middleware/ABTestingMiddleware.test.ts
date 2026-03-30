import { describe, it, expect } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { determineVersion, withABTest } from './ABTestingMiddleware'

describe('ABTestingMiddleware', () => {
  describe('determineVersion', () => {
    it('should respect force header x-api-version=v2', () => {
      const request = new NextRequest('http://localhost/api/orders', {
        headers: { 'x-api-version': 'v2' }
      })

      const context = determineVersion(request, 'v2-orders-create')

      expect(context.version).toBe('v2')
    })

    it('should respect force header x-api-version=v1', () => {
      const request = new NextRequest('http://localhost/api/orders', {
        headers: { 'x-api-version': 'v1' }
      })

      const context = determineVersion(request, 'v2-orders-create')

      expect(context.version).toBe('v1')
    })

    it('should default to v1 when flag is disabled', () => {
      const request = new NextRequest('http://localhost/api/orders')

      // Flag 'v2-full' is disabled by default
      const context = determineVersion(request, 'v2-full')

      expect(context.version).toBe('v1')
    })
  })

  describe('withABTest wrapper', () => {
    it('should route to v2 handler when flag enabled', async () => {
      let v1Called = false
      let v2Called = false

      const v1Handler = async () => {
        v1Called = true
        return NextResponse.json({ version: 'v1' })
      }

      const v2Handler = async () => {
        v2Called = true
        return NextResponse.json({ version: 'v2' })
      }

      const handler = withABTest('v2-orders-create', v2Handler, v1Handler)

      const request = new NextRequest('http://localhost/api/orders', {
        headers: { 'x-api-version': 'v2' }
      })

      const response = await handler(request)

      expect(v2Called).toBe(true)
      expect(v1Called).toBe(false)
      expect(response.headers.get('x-api-version')).toBe('v2')
    })

    it('should route to v1 handler when flag disabled', async () => {
      let v1Called = false
      let v2Called = false

      const v1Handler = async () => {
        v1Called = true
        return NextResponse.json({ version: 'v1' })
      }

      const v2Handler = async () => {
        v2Called = true
        return NextResponse.json({ version: 'v2' })
      }

      const handler = withABTest('v2-orders-create', v2Handler, v1Handler)

      const request = new NextRequest('http://localhost/api/orders', {
        headers: { 'x-api-version': 'v1' }
      })

      const response = await handler(request)

      expect(v1Called).toBe(true)
      expect(v2Called).toBe(false)
      expect(response.headers.get('x-api-version')).toBe('v1')
    })

    it('should add response time header', async () => {
      const handler = withABTest(
        'v2-orders-create',
        async () => NextResponse.json({ ok: true }),
        async () => NextResponse.json({ ok: true })
      )

      const request = new NextRequest('http://localhost/api/orders', {
        headers: { 'x-api-version': 'v2' }
      })

      const response = await handler(request)

      expect(response.headers.get('x-response-time')).toBeDefined()
    })
  })
})
