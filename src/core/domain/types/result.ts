/**
 * Re-export Result from canonical location.
 * Fixes imports from '@core/domain/types/result'
 */
export { Result, Success, Failure, ok, fail } from '@core/shared/Result';
export type { Result as ResultType } from '@core/shared/Result';
