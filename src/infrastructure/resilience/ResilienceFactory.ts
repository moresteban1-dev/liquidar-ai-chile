import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { Result, fail } from '@/core/domain/types/result';
import { AppError } from '@/core/shared/AppError';

export interface ResilienceOptions {
  retries?: number
  backoffMs?: number
  timeoutMs?: number
  name: string
}

/**
 * ResilienceFactory
 * 
 * Provides utility wrappers to make operations more robust.
 */
export class ResilienceFactory {
  constructor(private readonly logger: StructuredLogger) {
    this.logger = logger.child({ component: 'ResilienceFactory' })
  }

  /**
   * Wraps an async function with retry and timeout logic.
   */
  async execute<T>(
    operation: () => Promise<Result<T, AppError>>,
    options: ResilienceOptions
  ): Promise<Result<T, AppError>> {
    const { retries = 3, backoffMs = 1000, timeoutMs = 5000, name } = options
    let lastError: AppError | undefined

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await this.withTimeout(operation(), timeoutMs, name)
        
        if (result.isSuccess()) {
          if (attempt > 0) {
            this.logger.info(`Operation ${name} succeeded after ${attempt} retries`)
          }
          return result
        }

        lastError = result.getError()
        this.logger.warn(`Operation ${name} failed at domain level (attempt ${attempt + 1}/${retries + 1}): ${lastError.message}`)

      } catch (error: unknown) {
        const appErr = AppError.from(error)
        lastError = appErr
        
        if (error instanceof Error && error.name === 'TimeoutError') {
          this.logger.warn(`Operation ${name} timed out (attempt ${attempt + 1}/${retries + 1})`)
        } else {
          this.logger.warn(`Operation ${name} failed (attempt ${attempt + 1}/${retries + 1}): ${(error instanceof Error ? error.message : String(error))}`)
        }
      }

      if (attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt) // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    this.logger.error(`Operation ${name} failed after ${retries + 1} attempts`, { error: lastError })
    return fail(lastError || AppError.internal(`Operation ${name} failed after all retries`))
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    name: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const error = new Error(`Operation ${name} timed out after ${timeoutMs}ms`)
        error.name = 'TimeoutError'
        reject(error)
      }, timeoutMs)

      promise
        .then(res => {
          clearTimeout(timer)
          resolve(res)
        })
        .catch(err => {
          clearTimeout(timer)
          reject(err)
        })
    })
  }
}
