import { ICommand } from '@core/shared/ICommand';
import { ICommandHandler } from '@core/shared/ICommandHandler';
import { ICommandBus } from '@core/shared/ICommandBus';
import { Result, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { trace, SpanStatusCode } from '@opentelemetry/api';

/**
 * A lightweight, in-memory implementation of the Command Bus with Telemetry.
 */
export class InProcessCommandBus implements ICommandBus {
    private handlers: Map<string, ICommandHandler<any, any>> = new Map();
    private tracer = trace.getTracer('command-bus');

    public registerHandler(commandName: string, handler: ICommandHandler<any, any>): void {
        this.handlers.set(commandName, handler);
    }

    public async dispatch<TResult = any>(command: ICommand): Promise<Result<TResult, AppError>> {
        return await this.tracer.startActiveSpan(`command.${command.commandName}`, async (span) => {
            const handler = this.handlers.get(command.commandName);

            if (!handler) {
                const error = AppError.internal(`No command handler registered for command: ${command.commandName}`);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                span.end();
                return fail(error);
            }

            try {
                const result = await handler.handle(command);
                
                if (result.isFailure()) {
                    span.setStatus({ 
                        code: SpanStatusCode.ERROR, 
                        message: result.getError().toString() 
                    });
                } else {
                    span.setStatus({ code: SpanStatusCode.OK });
                }
                
                return result;
            } catch (error) {
                const appError = AppError.from(error);
                span.recordException(error as Error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: appError.message });
                return fail(appError);
            } finally {
                span.end();
            }
        });
    }
}
