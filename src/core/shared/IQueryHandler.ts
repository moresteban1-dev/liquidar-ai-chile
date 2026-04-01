import { Result } from './Result';
import { AppError } from '@core/shared/AppError';

/**
 * Interface for application-level query handlers.
 * Each handler is responsible for a single query.
 */
export interface IQueryHandler<TQuery, TResult> {
    /**
     * Executes the query logic.
     * @returns A Result object containing either the success value or an AppError.
     */
    handle(query: TQuery): Promise<Result<TResult, AppError>>;
}
