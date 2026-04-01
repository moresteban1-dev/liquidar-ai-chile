import { ICommand } from './ICommand';
import { Result } from './Result';
import { AppError } from '@core/shared/AppError';

/**
 * Interface for the application command bus.
 * Decouples the command source from the concrete handler implementation.
 */
export interface ICommandBus {
    /**
     * Dispatches a command to its registered handler.
     * @param command The command to execute.
     */
    dispatch<TResult = any>(command: ICommand): Promise<Result<TResult, AppError>>;
}
