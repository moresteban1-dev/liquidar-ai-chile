/**
 * Re-export Result from canonical location.
 * Fixes imports like: import { Result } from '../../shared/Result'
 */
export { Result, Success, Failure, ok, fail } from '@core/shared/Result';
export type { Result as ResultType } from '@core/shared/Result';
