/**
 * Re-export from shared for backward compatibility.
 * Fixes: import { Result } from './Result' in infrastructure/shared
 */
export { Result, Success, Failure, ok, fail } from '@core/shared/Result';
