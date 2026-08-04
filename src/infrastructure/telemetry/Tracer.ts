import { trace, Span, SpanStatusCode } from '@opentelemetry/api'

const TRACER_NAME = 'liquidar-cl'

export function getTracer() {
  return trace.getTracer(TRACER_NAME)
}

export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer()

  return tracer.startActiveSpan(name, async (span) => {
    try {
      span.setAttributes(attributes)
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message
      })
      throw error
    } finally {
      span.end()
    }
  })
}

export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan()
  return span?.spanContext().traceId
}
