import { trace, Span, SpanStatusCode, Tracer } from '@opentelemetry/api';

/**
 * Higher-order function to wrap a function call with an OpenTelemetry span.
 * 
 * @param name The name of the span.
 * @param fn The function to execute within the span.
 * @returns The result of the function execution.
 */
export async function withTracing<T>(
    name: string, 
    fn: (span: Span) => Promise<T>
): Promise<T> {
    const tracer: Tracer = trace.getTracer('dropservice-platform');
    
    return await tracer.startActiveSpan(name, async (span) => {
        try {
            const result = await fn(span);
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ 
                code: SpanStatusCode.ERROR, 
                message: error instanceof Error ? error.message : 'Unknown error' 
            });
            throw error;
        } finally {
            span.end();
        }
    });
}
