import { logger } from './infrastructure/telemetry/StructuredLogger';

/**
 * Next.js Instrumentation Hook
 *
 * Runs BEFORE anything else in the server runtime.
 */

export async function register() {
    if (process.env['NEXT_RUNTIME'] === 'nodejs') {
        // 1. Initialize Observability (OpenTelemetry) [NASA-Grade]
        try {
            const { initObservability } = await import('./infrastructure/telemetry/otel-sdk');
            initObservability();
        } catch (error) {
            logger.error('Failed to init observability in instrumentation', error as Error);
        }

        // 2. Initialize DI and Application Registry via Bindings [NEW]
        try {
            // Importar bindings auto-registra el contenedor global
            await import('./infrastructure/di/bindings');
            
            logger.info(
                '\x1b[36m[SYSTEM INITIALIZED]\x1b[0m NASA-Grade Architecture (v2) Ready',
            );
        } catch (error) {
            logger.error('Failed to init DI bindings in instrumentation', error as Error);
        }
    }
}

export function onRequestError(
    err: Error & { digest?: string },
    request: {
        path: string;
        method: string;
        headers: Record<string, string>;
    }
) {
    // Manejo de errores simplificado para evitar dependencias circulares pesadas
    console.error(`[Instrumentation Error] ${request.method} ${request.path}:`, err);
}
