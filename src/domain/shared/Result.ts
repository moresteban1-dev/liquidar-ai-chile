/**
 * Enterprise Result Pattern implementation for Domain-Driven Design (DDD)
 * Replaces try/catch and thrown exceptions for explicit, type-safe error handling.
 */

export class Result<T, E = string> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, error?: E, value?: T) {
    if (isSuccess && error) {
      throw new Error("InvalidOperation: A Result cannot be successful and contain an error.");
    }
    if (!isSuccess && error === undefined) {
      throw new Error("InvalidOperation: A failing Result must contain an error message or object.");
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
  }

  public getValue(): T {
    if (!this.isSuccess || this._value === undefined) {
      throw new Error("CantRetrieveValueFromFailedResult: Use getValue() only after checking isSuccess.");
    }
    return this._value;
  }

  public getError(): E {
    if (!this.isFailure || this._error === undefined) {
      throw new Error("CantRetrieveErrorFromSuccessfulResult: Use getError() only after checking isFailure.");
    }
    return this._error;
  }

  public static ok<U, E = string>(value?: U): Result<U, E> {
    return new Result<U, E>(true, undefined, value as U);
  }

  public static fail<U, E = string>(error: E): Result<U, E> {
    return new Result<U, E>(false, error, undefined);
  }

  public static combine<E = string>(results: Result<unknown, E>[]): Result<void, E> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail<void, E>(result.getError());
      }
    }
    return Result.ok<void, E>();
  }

  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error!);
    }
    return Result.ok<U, E>(fn(this._value!));
  }

  public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error!);
    }
    return fn(this._value!);
  }
}
