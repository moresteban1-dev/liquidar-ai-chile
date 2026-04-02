import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { z } from 'zod';
import { validate } from '@core/validation/zod-helper';
import { AppError, ErrorCode } from '@core/shared/AppError';
import { rateLimit } from '@/lib/security/rate-limiter';

// ─── Standardized Action Response ───
export type ActionResponse<T = void> =
    | { status: 'success'; data: T; message?: string }
    | { status: 'error'; error: string; code: ErrorCode; details?: unknown };

// ─── Generic Action Creator ───
export function createAction<TInput, TOutput>(
    config: {
        name: string;
        schema: z.ZodSchema<TInput>;
        rateLimitKey?: string;
        rateLimitMax?: number; // Requests per minute
    },
    handler: (input: TInput) => Promise<TOutput>
) {
    return async (rawInput: unknown): Promise<ActionResponse<TOutput>> => {
        try {
            // 1. Rate Limiting
            if (config.rateLimitKey) {
                const allowed = await rateLimit({
                    identifier: config.rateLimitKey,
                    action: config.name,
                    maxAttempts: config.rateLimitMax ?? 10,
                    windowMs: 60 * 1000
                });
                if (!allowed) {
                    return {
                        status: 'error',
                        error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
                        code: ErrorCode.AI_RATE_LIMITED,
                    };
                }
            }

            // 2. Validation
            // We use our Result Pattern validator which returns Result<T>
            const validationResult = validate(config.schema, rawInput);

            if (!validationResult.success) {
                // If it's a Validation AppError (standardized)
                const error = validationResult.error;
                return {
                    status: 'error',
                    error: error.message,
                    code: error.code,
                    details: error.details
                };
            }

            // 3. Execution
            const data = await handler(validationResult.data);

            return { status: 'success', data };

        } catch (error) {
            const appError = AppError.from(error);

            // Log critical errors
            if (!appError.isOperational) {
                logger.error(`[Action: ${config.name}] Critical Error:`, error);
            }

            return {
                status: 'error',
                error: appError.isOperational ? appError.message : 'Ha ocurrido un error inesperado.',
                code: appError.code,
            };
        }
    };
}
