// src/infrastructure/telemetry/otel-sdk.ts

import { NodeSDK } from '@opentelemetry/sdk-node'
// [REMOVED] o
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { logger } from './StructuredLogger'

/**
 * OTEL SDK Configuration
 * 
 * Minimalist version to avoid Resource export issues in Turbopack.
 */
export function initObservability() {
  if (process.env.NODE_ENV === 'test') return

  // Usamos una configuración minimalista que no requiere la clase Resource explícita
  const sdk = new NodeSDK({
    serviceName: 'liquidar-cl',
    traceExporter: new ConsoleSpanExporter(),
  })

  try {
    sdk.start()
    logger.info('🔭 OpenTelemetry initialized successfully')
  } catch (error) {
    logger.error('❌ Failed to initialize OpenTelemetry', error as Error)
  }

  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => logger.info('🔭 OpenTelemetry shut down'))
      .catch((error) => logger.error('❌ Error shutting down OpenTelemetry', error as Error))
      .finally(() => process.exit(0))
  })
}
