import { Result } from './Result';
import { ICommand } from './ICommand';
import { AppError } from '@core/shared/AppError';

/**
 * Interface for application-level command handlers.
 * Each handler is responsible for a single command.
 */
export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
    /**
     * Executes the command logic.
     * @returns A Result object containing either the success value or an AppError.
     */
    handle(command: TCommand): Promise<Result<TResult, AppError>>;
}
