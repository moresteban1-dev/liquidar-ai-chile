import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { ai, AI_MODELS } from '../genkit-client';
import { z } from 'genkit';
import { AppError } from '@core/shared/AppError';
import { Result, ok, fail } from '@core/shared/Result';
import { modelRouter, type TaskComplexity } from '../router/ModelRouter';
import { semanticCache } from '@infrastructure/cache/semantic-cache';

// ─── Circuit Breaker ───
export class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    constructor(
        private readonly threshold: number = 5,
        private readonly resetTimeoutMs: number = 60_000
    ) { }

    async execute<T>(fn: () => Promise<T>, context: string): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
                this.state = 'HALF_OPEN';
                logger.warn(`Circuit Breaker HALF_OPEN for ${context}`);
            } else {
                throw AppError.internal('AI Unavailable');
            }
        }

        try {
            const result = await fn();
            this.onSuccess(context);
            return result;
        } catch (error) {
            this.onFailure(context);
            throw error;
        }
    }

    private onSuccess(context: string) {
        if (this.state !== 'CLOSED') {
            logger.info(`Circuit Breaker CLOSED for ${context}`);
        }
        this.failures = 0;
        this.state = 'CLOSED';
    }

    private onFailure(context: string) {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
            logger.error(`Circuit Breaker OPENED for ${context} due to failures`, undefined, {
                failures: this.failures
            });
        }
    }
}

// ─── Service Implementation ───
const circuitBreaker = new CircuitBreaker(5, 60_000);

export async function executeAIFlow<
    TInput,
    TOutput extends z.ZodTypeAny
>(params: {
    name: string;
    input: TInput;
    outputSchema: TOutput;
    prompt: string;
    complexity?: TaskComplexity; // New param
    model?: keyof typeof AI_MODELS; // Optional override
    temperature?: number;
    timeoutMs?: number;
    maxRetries?: number;
    useCache?: boolean;
}): Promise<Result<z.infer<TOutput>, AppError>> {
    const {
        name,
        outputSchema,
        prompt,
        complexity,
        model: explicitModel,
        temperature = 0.3,
        // timeoutMs = 30_000,
        // maxRetries = 2,
        useCache = true,
    } = params;

    // Smart Routing
    const selectedModelKey = explicitModel ?? modelRouter.route({ prompt, ...(complexity ? { complexity } : {}) });
    const selectedModel = AI_MODELS[selectedModelKey];

    const loggerCtx = logger.child({ flow: name, model: selectedModelKey });

    try {
        // 1. Semantic Cache
        if (useCache) {
            const cached = await semanticCache.get(prompt);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const valid = outputSchema.safeParse(parsed);
                    if (valid.success) {
                        loggerCtx.info('Cache HIT');
                        return ok(valid.data);
                    }
                } catch { /* ignore */ }
            }
        }

        // 2. Execution
        const output = await circuitBreaker.execute(async () => {
            const response = await ai.generate({
                model: selectedModel,
                prompt,
                output: { schema: outputSchema },
                config: { temperature },
            });

            if (!response.output) {
                throw AppError.validation('No output generated');
            }
            return response.output;
        }, name); // Pass context name

        // 3. Validation
        const parsed = outputSchema.safeParse(output);
        if (!parsed.success) {
            throw AppError.validation('Schema validation failed - Invalid AI Response');
        }

        // 4. Cache Update
        if (useCache) {
            await semanticCache.set(prompt, JSON.stringify(output));
            loggerCtx.info('Cache Updated');
        }

        return ok(parsed.data);
    } catch (error) {
        return fail(AppError.from(error));
    }
}
