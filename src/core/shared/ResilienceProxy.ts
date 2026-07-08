import { Result, fail } from './Result';

export enum CircuitState {
    CLOSED,
    OPEN,
    HALF_OPEN
}

/**
 * ResilienceProxy
 * 
 * Implementación de un Circuit Breaker ligero para proteger el sistema
 * contra fallos en servicios de infraestructura externos.
 */
export class ResilienceProxy {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private _lastFailureTime?: number;
    private nextAttemptTime?: number;

    constructor(
        private readonly threshold: number = 3,
        private readonly resetTimeoutMs: number = 10000
    ) {}

    async execute<T, E = Error>(fn: () => Promise<Result<T, E>>): Promise<Result<T, E>> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() > (this.nextAttemptTime || 0)) {
                this.state = CircuitState.HALF_OPEN;
            } else {
                return fail(new Error('Circuit Breaker is OPEN. Operation aborted.') as unknown as E);
            }
        }

        try {
            const result = await fn();

            if (result.isSuccess()) {
                this.reset();
                return result;
            } else {
                return this.handleFailure<T, E>(result.getError() as unknown as E);
            }
        } catch (error) {
            return this.handleFailure<T, E>(error as E);
        }
    }

    private handleFailure<T, E>(error: E): Result<T, E> {
        this.failureCount++;
        this._lastFailureTime = Date.now();

        if (this.failureCount >= this.threshold) {
            this.state = CircuitState.OPEN;
            this.nextAttemptTime = Date.now() + this.resetTimeoutMs;
        }

        return fail(error);
    }

    private reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this._lastFailureTime = undefined;
        this.nextAttemptTime = undefined;
    }

    public getLastFailureTime(): number | undefined {
        return this._lastFailureTime;
    }

    getState(): CircuitState {
        return this.state;
    }
}
