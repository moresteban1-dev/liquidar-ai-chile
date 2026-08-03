/**
 * StructuredLogger — Edge-Safe, Universal Runtime Logger
 * 
 * Compatible con: Node.js, Vercel Edge, Vercel Serverless, Browser ('use client')
 * 
 * Reemplaza la implementación anterior basada en `pino` que causaba crash
 * fatal en componentes 'use client' y en el Edge Runtime de Vercel por
 * dependencias a módulos Node.js nativos (stream, fs, worker_threads).
 * 
 * Usa `console.*` nativo con formato estructurado JSON para mantener
 * compatibilidad con sistemas de observabilidad (Vercel Logs, Datadog, etc.)
 */

/** Intenta obtener trace context de OpenTelemetry si está disponible */
function getTraceContext(): Record<string, string> {
    try {
        // Dynamic import guard: OpenTelemetry solo está disponible en Node.js server
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { trace } = require('@opentelemetry/api');
        const span = trace.getActiveSpan();
        if (!span) return {};
        const ctx = span.spanContext();
        return { trace_id: ctx.traceId, span_id: ctx.spanId };
    } catch {
        // OpenTelemetry no disponible (browser, edge) — silencioso
        return {};
    }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    fatal: 50,
};

function getConfiguredLevel(): LogLevel {
    try {
        const envLevel = (typeof process !== 'undefined' && process.env?.['LOG_LEVEL']) || 'info';
        return (envLevel as LogLevel) in LOG_LEVEL_PRIORITY ? (envLevel as LogLevel) : 'info';
    } catch {
        return 'info';
    }
}

export class StructuredLogger {
    private readonly name: string;
    private readonly contextData: Record<string, unknown>;
    private readonly minLevel: number;

    constructor(name?: string, contextData?: Record<string, unknown>) {
        this.name = name || 'liquidar-cl';
        this.contextData = contextData || {};
        this.minLevel = LOG_LEVEL_PRIORITY[getConfiguredLevel()];
    }

    static create(options: { component: string }): StructuredLogger {
        return new StructuredLogger(options.component);
    }

    child(options: Record<string, unknown>): StructuredLogger {
        return new StructuredLogger(this.name, { ...this.contextData, ...options });
    }

    withContext(context: Record<string, unknown>): StructuredLogger {
        return this.child(context);
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.log('debug', message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.log('info', message, context);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        this.log('warn', message, context);
    }

    error(message: string, error?: unknown, context?: Record<string, unknown>): void {
        const errorObj = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
        this.log('error', message, {
            ...context,
            error: errorObj.message,
            stack: errorObj.stack,
        });
    }

    fatal(message: string, error?: unknown, context?: Record<string, unknown>): void {
        const errorObj = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
        this.log('fatal', message, {
            ...context,
            error: errorObj.message,
            stack: errorObj.stack,
        });
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
        if (LOG_LEVEL_PRIORITY[level] < this.minLevel) return;

        const traceCtx = getTraceContext();
        const entry = {
            level,
            name: this.name,
            msg: message,
            time: new Date().toISOString(),
            ...this.contextData,
            ...traceCtx,
            ...context,
        };

        switch (level) {
            case 'debug':
                console.debug(JSON.stringify(entry));
                break;
            case 'info':
                console.info(JSON.stringify(entry));
                break;
            case 'warn':
                console.warn(JSON.stringify(entry));
                break;
            case 'error':
                console.error(JSON.stringify(entry));
                break;
            case 'fatal':
                console.error(`[FATAL] ${JSON.stringify(entry)}`);
                break;
        }
    }
}

export const logger = new StructuredLogger();
