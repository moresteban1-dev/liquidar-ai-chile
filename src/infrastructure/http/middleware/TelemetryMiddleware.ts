import { NextRequest, NextResponse } from 'next/server'
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'
import { metricsCollector } from '@/infrastructure/telemetry/MetricsCollector'

const tracer = trace.getTracer('dropservice-api')

export function withTelemetry<T extends Record<string, string> = Record<string, string>>(
  handler: (request: NextRequest, context: { params: Promise<T> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Promise<T> }): Promise<NextResponse> => {
    const startTime = performance.now()
    const method = request.method
    const path = request.nextUrl.pathname
    const spanName = `HTTP ${method} ${path}`

    return tracer.startActiveSpan(
      spanName,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': method,
          'http.url': request.url,
          'http.target': path
        }
      },
      async (span) => {
        try {
          logger.info(`→ ${method} ${path}`, { method, path })
          const response = await handler(request, context)
          const duration = performance.now() - startTime
          const status = response.status

          metricsCollector.recordApiRequest(method, path, status, duration)
          span.setAttributes({ 'http.status_code': status, 'http.response_time_ms': duration })

          if (status >= 400) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${status}` })
          } else {
            span.setStatus({ code: SpanStatusCode.OK })
          }

          logger.info(`← ${method} ${path} ${status}`, { method, path, status, duration_ms: Math.round(duration) })
          response.headers.set('X-Trace-Id', span.spanContext().traceId)
          return response
        } catch (error) {
          const duration = performance.now() - startTime
          span.recordException(error as Error)
          span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message })
          metricsCollector.recordApiRequest(method, path, 500, duration)
          logger.error(`✗ ${method} ${path} ERROR`, error as Error, { method, path })
          throw error
        } finally {
          span.end()
        }
      }
    )
  }
}
