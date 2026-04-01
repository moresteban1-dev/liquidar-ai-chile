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

    async execute<T>(fn: () => Promise<Result<T, any>>): Promise<Result<T, any>> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() > (this.nextAttemptTime || 0)) {
                this.state = CircuitState.HALF_OPEN;
            } else {
                return fail(new Error('Circuit Breaker is OPEN. Operation aborted.'));
            }
        }

        try {
            const result = await fn();

            if (result.isSuccess()) {
                this.reset();
                return result;
            } else {
                return this.handleFailure(result.getError());
            }
        } catch (error) {
            return this.handleFailure(error);
        }
    }

    private handleFailure(error: any): Result<any, any> {
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
