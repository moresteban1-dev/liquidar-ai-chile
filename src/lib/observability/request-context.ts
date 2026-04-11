import { type AsyncLocalStorage as AsyncLocalStorageType } from 'node:async_hooks';
import type { LogContext } from '@infrastructure/telemetry/logger-types';

export interface RequestContextProps extends LogContext {
    startTime: number;
    path?: string;
    method?: string;
    ip?: string;
}

// Internal store reference - Using 'any' to avoid circular type issues before full initialization
 
let store: any;

// Safe initialization that doesn't break Edge Runtime
try {
     
    const { AsyncLocalStorage } = require('node:async_hooks');
    store = new AsyncLocalStorage();
} catch {
    // Fallback for Edge Runtime (Storage not supported)
    // We log to console here instead of using the custom logger to avoid circular dependency
    console.warn('[RequestContext] AsyncLocalStorage not supported in this runtime (Edge/Browser). Context will not persist.');
    store = {
        getStore: () => undefined,
        run: <T>(_ctx: RequestContextProps, cb: () => T) => cb(),
    };
}

export const requestContext = store as AsyncLocalStorageType<RequestContextProps>;

export function getCorrelationId(): string | undefined {
    return requestContext.getStore()?.correlationId;
}

export function getRequestContext(): RequestContextProps | undefined {
    return requestContext.getStore();
}

export function runWithContext<T>(ctx: RequestContextProps, callback: () => T): T {
    return requestContext.run(ctx, callback);
}
