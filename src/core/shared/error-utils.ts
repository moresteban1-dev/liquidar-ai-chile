/**
 * Error Utilities — Centralized error handling for TypeScript strict mode.
 * 
 * Provides type-safe extraction of error messages from `unknown` catch values.
 * This eliminates the TS2345 pattern: `Argument of type 'unknown' is not assignable to parameter of type 'Error | undefined'`.
 * 
 * @module error-utils
 */

/**
 * Extracts a safe error message from any `unknown` value.
 * Designed for catch blocks in TypeScript strict mode.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (
        error !== null &&
        error !== undefined &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
    ) {
        return (error as { message: string }).message;
    }
    return 'Unknown error occurred';
}

/**
 * Converts any `unknown` value to an Error instance.
 * Useful when APIs require an Error object rather than a string.
 */
export function toError(error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error(getErrorMessage(error));
}

/**
 * Type guard to verify if an unknown value is an Error instance.
 */
export function isError(error: unknown): error is Error {
    return error instanceof Error;
}
