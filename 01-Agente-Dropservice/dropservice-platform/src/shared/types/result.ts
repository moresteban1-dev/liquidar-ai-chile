export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
    readonly ok = true as const;
    constructor(readonly value: T) { }

    map<U>(fn: (value: T) => U): Result<U, never> {
        return new Success(fn(this.value));
    }

    flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return fn(this.value);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getOrElse(_fallback: T): T {
        return this.value;
    }

    getOrThrow(): T {
        return this.value;
    }
}

export class Failure<E> {
    readonly ok = false as const;
    constructor(readonly error: E) { }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map<U>(_fn: (value: never) => U): Result<U, E> {
        return this as unknown as Result<U, E>;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    flatMap<U>(_fn: (value: never) => Result<U, E>): Result<U, E> {
        return this as unknown as Result<U, E>;
    }

    getOrElse<T>(fallback: T): T {
        return fallback;
    }

    getOrThrow(): never {
        throw this.error;
    }
}

export const ok = <T>(value: T): Success<T> => new Success(value);
export const fail = <E>(error: E): Failure<E> => new Failure(error);

// Wrapper for async functions that might fail
export async function tryAsync<T>(
    fn: () => Promise<T>
): Promise<Result<T, Error>> {
    try {
        return ok(await fn());
    } catch (error) {
        return fail(error instanceof Error ? error : new Error(String(error)));
    }
}
