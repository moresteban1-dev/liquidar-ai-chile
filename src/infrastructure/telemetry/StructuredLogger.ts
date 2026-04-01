import pino from 'pino'
import { trace } from '@opentelemetry/api'

export class StructuredLogger {
  private logger: pino.Logger

  constructor(name?: string) {
    const pinoOptions: pino.LoggerOptions = {
      name: name || 'dropservice',
      level: process.env['LOG_LEVEL'] || 'info',
      mixin: () => {
        const span = trace.getActiveSpan()
        if (!span) return {}
        const ctx = span.spanContext()
        return {
          trace_id: ctx.traceId,
          span_id: ctx.spanId
        }
      }
    }

    // if (process.env['NODE_ENV'] !== 'production' && !process.env['VITEST']) {
    //   pinoOptions.transport = { target: 'pino-pretty', options: { colorize: true } }
    // }

    this.logger = pino(pinoOptions)
  }

  static create(options: { component: string }): StructuredLogger {
    return new StructuredLogger(options.component)
  }

  child(options: Record<string, unknown>): StructuredLogger {
    const newLogger = new StructuredLogger()
    newLogger.logger = this.logger.child(options)
    return newLogger
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(context, message)
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(context, message)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(context, message)
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'))
    this.logger.error({ ...context, error: errorObj.message, stack: errorObj.stack }, message)
  }

  fatal(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'))
    this.logger.fatal({ ...context, error: errorObj.message, stack: errorObj.stack }, message)
  }

  withContext(context: Record<string, unknown>): StructuredLogger {
    return this.child(context);
  }
}

export const logger = new StructuredLogger()
