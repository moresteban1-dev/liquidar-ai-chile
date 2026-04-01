import { Logger } from '@domain/ports/Logger';
import { StructuredLogger } from './StructuredLogger';

/**
 * LoggerAdapter
 * 
 * Implementation of the domain's Logger port using StructuredLogger.
 * Adheres to hexagonal architecture by keeping infrastructure details away from core.
 */
export class LoggerAdapter implements Logger {
    private logger: StructuredLogger;

    constructor(component: string = 'core') {
        this.logger = new StructuredLogger(component);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.logger.info(message, context);
    }

    error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
        const err = error instanceof Error ? error : (error ? new Error(String(error)) : undefined);
        this.logger.error(message, err, context);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        this.logger.warn(message, context);
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.logger.debug(message, context);
    }
}
