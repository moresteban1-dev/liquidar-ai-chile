import { metrics } from '../telemetry/MetricsService';
import { Result, ok, fail } from '@/core/domain/types/result';
import { AppError } from '@/core/shared/AppError';

/**
 * Circuit Breaker States
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation, calls go through
  OPEN = 'OPEN',         // Failure detected, calls blocked
  HALF_OPEN = 'HALF_OPEN' // Recovering, testing if calls succeed
}

export interface CircuitBreakerOptions {
  failureThreshold: number;    // Number of failures before opening the circuit
  resetTimeout: number;        // Time in ms before trying to close the circuit (HALF_OPEN)
  successThreshold: number;    // Number of successes in HALF_OPEN before closing
  name: string;
}

/**
 * Generic Circuit Breaker Implementation
 * Prevents cascading failures by stopping calls to failing services.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastError: Error | null = null;
  private nextAttempt: number = 0;
  private _lastStateChange: number = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  public async execute<T>(action: () => Promise<Result<T, AppError>>): Promise<Result<T, AppError>> {
    this.updateState();

    if (this.state === CircuitState.OPEN) {
      return fail(AppError.internal(`Circuit Breaker [${this.options.name}] is OPEN. Last error: ${this.lastError?.message}`));
    }

    try {
      const result = await action();
      if (result.isSuccess()) {
        this.onSuccess();
      } else {
        this.onFailure(new Error(result.getError().message));
      }
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.onFailure(err);
      return fail(AppError.from(err));
    }
  }

  private updateState(): void {
    if (this.state === CircuitState.OPEN && Date.now() >= this.nextAttempt) {
      this.setState(CircuitState.HALF_OPEN);
      this.successCount = 0;
    }
  }

  private setState(state: CircuitState): void {
    const oldState = this.state;
    this.state = state;
    this._lastStateChange = Date.now();
    
    // Report to Metrics
    metrics.record(`circuit_breaker_${this.options.name}_state`, 
        state === CircuitState.OPEN ? 0 : (state === CircuitState.HALF_OPEN ? 1 : 2)
    );
    
    if (oldState !== state) {
        metrics.increment(`circuit_breaker_${this.options.name}_state_change_total`);
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.setState(CircuitState.CLOSED);
      }
    }
  }

  private onFailure(error: Error): void {
    this.lastError = error;
    this.failureCount++;

    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.options.failureThreshold) {
      this.setState(CircuitState.OPEN);
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }

  public getState(): CircuitState {
    this.updateState();
    return this.state;
  }

  public getName(): string {
    return this.options.name;
  }

  public getLastChangeTimestamp(): number {
    return this._lastStateChange;
  }
}
