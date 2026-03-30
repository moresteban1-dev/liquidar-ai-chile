export type Result<T, E = string> = Success<T> | Failure<E>

export class Success<T> {
  readonly kind = 'success' as const
  
  constructor(public readonly value: T) {}

  // ── Backward-compatible getters ──────────────────────────
  /** @deprecated Use isSuccess() instead */
  get success(): true { return true }
  /** @deprecated Use getValue() instead */
  get data(): T { return this.value }

  isSuccess(): this is Success<T> {
    return true
  }

  isFailure(): this is never {
    return false
  }

  getValue(): T {
    return this.value
  }

  getError(): never {
    throw new Error('Cannot get error from a Success result')
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value))
  }

  flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value)
  }

  mapError<F>(_fn: (error: never) => F): Result<T, never> {
    return this
  }

  unwrap(): T {
    return this.value
  }

  unwrapOr(_defaultValue: T): T {
    return this.value
  }

  match<U>(matcher: { 
    success: (value: T) => U
    failure: (error: never) => U 
  }): U {
    return matcher.success(this.value)
  }
}

export class Failure<E> {
  readonly kind = 'failure' as const
  
  constructor(public readonly error: E) {}

  // ── Backward-compatible getters ──────────────────────────
  /** @deprecated Use isSuccess() instead */
  get success(): false { return false }
  /** @deprecated Use getError() instead */
  get data(): undefined { return undefined }
  /** @deprecated Use getValue() — will throw on Failure */
  get value(): never { return this.getValue() }

  isSuccess(): this is never {
    return false
  }

  isFailure(): this is Failure<E> {
    return true
  }

  getValue(): never {
    throw new Error(`Cannot get value from a Failure result: ${this.error}`)
  }

  getError(): E {
    return this.error
  }

  map<U>(_fn: (value: never) => U): Result<never, E> {
    return this
  }

  flatMap<U, F>(_fn: (value: never) => Result<U, F>): Result<never, F> {
    return this as any
  }

  mapError<F>(fn: (error: E) => F): Result<never, F> {
    return new Failure(fn(this.error))
  }

  unwrap(): never {
    throw new Error(`Called unwrap on a Failure: ${String(this.error)}`)
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue
  }

  match<U>(matcher: { 
    success: (value: never) => U
    failure: (error: E) => U 
  }): U {
    return matcher.failure(this.error)
  }
}

export const ok = <T>(value: T): Success<T> => new Success(value)
export const fail = <E>(error: E): Failure<E> => new Failure(error)

/**
 * Bridge for legacy static calls and utilities
 */
export const Result = {
  ok,
  fail,
  
  /**
   * Wraps an async function in a Result
   */
  async tryAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
    try {
      return ok(await fn())
    } catch (error) {
      return fail(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
