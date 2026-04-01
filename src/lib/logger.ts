import { logger as structuredLogger } from '@infrastructure/telemetry/StructuredLogger';
import { ILogger } from '@infrastructure/telemetry/logger-types';

/**
 * App-level Logger Adapter
 * 
 * This file maintains the existing API for components and services
 * while routing all logs through the centralized StructuredLogger.
 */

class LoggerAdapter implements ILogger {
    private context: Record<string, unknown> = {};

    child(context: Record<string, unknown>): ILogger {
        const child = new LoggerAdapter();
        child.context = { ...this.context, ...context };
        return child;
    }

    debug(msg: string, meta?: Record<string, unknown>) { 
        structuredLogger.debug(msg, { ...this.context, ...meta }); 
    }
    
    info(msg: string, meta?: Record<string, unknown>) { 
        structuredLogger.info(msg, { ...this.context, ...meta }); 
    }
    
    warn(msg: string, meta?: Record<string, unknown>) { 
        structuredLogger.warn(msg, { ...this.context, ...meta }); 
    }
    
    error(msg: string, meta?: Record<string, unknown>) { 
        structuredLogger.error(msg, undefined, { ...this.context, ...meta }); 
    }

    fatal(msg: string, meta?: Record<string, unknown>) { 
        structuredLogger.fatal(msg, undefined, { ...this.context, ...meta }); 
    }

    startTimer(operation: string) {
        const start = performance.now();
        return {
            end: (meta?: Record<string, unknown>) => {
                const duration = Math.round(performance.now() - start);
                this.info(`${operation} completado`, { ...meta, duration_ms: duration });
                return duration;
            },
        };
    }
}

export const logger = new LoggerAdapter();
export type { LoggerAdapter as Logger };
