/**
 * Marker interface for all application commands.
 * Commands are DTOs that represent a user intent to mutate state.
 */
export interface ICommand {
    /** Unique name of the command for dispatching and logging */
    readonly commandName: string;
}
