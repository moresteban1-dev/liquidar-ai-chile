
import { trace, SpanStatusCode, Span } from '@opentelemetry/api';
import { logger } from '../logger';

const tracer = trace.getTracer('dropservice-platform');

export function withTracing<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>
): Promise<T> {
    return tracer.startActiveSpan(name, async (span) => {
        try {
            if (attributes) {
                Object.entries(attributes).forEach(([k, v]) =>
                    span.setAttribute(k, v)
                );
            }
            const result = await fn(span);
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        } catch (error) {
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            span.recordException(error as Error);

            // Log locally as well for immediate visibility
            logger.error(`[Tracing] Operation failed: ${name}`, {
                error,
                spanId: span.spanContext().spanId,
                traceId: span.spanContext().traceId
            });

            throw error;
        } finally {
            span.end();
        }
    });
}
