import { Result } from '@/core/shared/Result'
import { withSpan } from '@/infrastructure/telemetry/Tracer'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'
import { metricsCollector } from '@/infrastructure/telemetry/MetricsCollector'
import { AppError } from '@/core/shared/AppError'

export abstract class InstrumentedHandler<TCommand, TResult, TError = AppError> {
  protected abstract handlerName: string
  protected abstract operationType: 'command' | 'query'

  async execute(command: TCommand): Promise<Result<TResult, TError>> {
    const startTime = performance.now()

    return withSpan(
      this.handlerName,
      this.extractSpanAttributes(command),
      async (span) => {
        try {
          logger.info(`${this.handlerName} started`, {
            handler: this.handlerName,
            type: this.operationType
          })

          const result = await this.handle(command)

          const duration = performance.now() - startTime

          if (result.isSuccess()) {
            logger.info(`${this.handlerName} completed`, {
              handler: this.handlerName,
              duration_ms: Math.round(duration * 100) / 100,
              success: true
            })

            metricsCollector.recordHandlerDuration(this.handlerName, duration, true)
            span.setAttributes({ 'handler.success': true, 'handler.duration_ms': duration })

          } else {
            const error = result.getError()
            const errorMessage = (error instanceof AppError) ? error.message : (typeof error === 'string' ? error : (error as any).message || 'Unknown error')
            
            logger.warn(`${this.handlerName} failed`, {
              handler: this.handlerName,
              duration_ms: Math.round(duration * 100) / 100,
              error: errorMessage,
              errorDetail: typeof error === 'object' ? error : undefined,
              success: false
            })

            metricsCollector.recordHandlerDuration(this.handlerName, duration, false)
            metricsCollector.recordBusinessError(this.handlerName, errorMessage)
            span.setAttributes({ 
                'handler.success': false, 
                'handler.error': errorMessage 
            })
          }

          return result

        } catch (error) {
          const duration = performance.now() - startTime
          logger.error(`${this.handlerName} threw exception`, error as Error, {
            handler: this.handlerName,
            duration_ms: Math.round(duration * 100) / 100
          })

          metricsCollector.recordHandlerError(this.handlerName, (error as Error).message)
          throw error
        }
      }
    )
  }

  protected abstract handle(command: TCommand): Promise<Result<TResult, TError>>
  protected abstract extractSpanAttributes(_command: TCommand): Record<string, string | number | boolean>
}
