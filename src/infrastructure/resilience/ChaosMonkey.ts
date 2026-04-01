import { logger } from '../telemetry/StructuredLogger';
import { Result, fail } from '@/core/domain/types/result';
import { AppError } from '@/core/shared/AppError';

/**
 * Utility for active resilience verification (Chaos Engineering).
 */
export class ChaosMonkey {
    private isEnabled: boolean = false;
    private errorProbability: number = 0;
    private maxLatency: number = 0;

    public enable(errorProbability: number = 0.1, maxLatency: number = 2000): void {
        this.isEnabled = true;
        this.errorProbability = errorProbability;
        this.maxLatency = maxLatency;
        logger.warn(`[CHAOS] Monkey enabled! (Err: ${errorProbability * 100}%, Latency: ${maxLatency}ms)`);
    }

    public disable(): void {
        this.isEnabled = false;
        logger.info("[CHAOS] Monkey disabled.");
    }

    public async execute<T, E extends AppError = AppError>(fn: () => Promise<Result<T, E>>): Promise<Result<T, E>> {
        if (!this.isEnabled) return fn();

        // 1. Inject Latency
        if (this.maxLatency > 0) {
            const delay = Math.floor(Math.random() * this.maxLatency);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 2. Inject Error
        if (Math.random() < this.errorProbability) {
            logger.error("[CHAOS] Injecting fault...");
            return fail(AppError.internal("ChaosMonkey Injected Failure") as E);
        }

        return fn();
    }
}

export const chaosMonkey = new ChaosMonkey();
