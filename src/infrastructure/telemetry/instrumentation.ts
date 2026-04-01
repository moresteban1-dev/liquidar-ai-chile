/**
 * OpenTelemetry Instrumentation — Simplified for Vercel compatibility.
 * 
 * Uses explicit type casts to handle cross-version type mismatches
 * between OTel SDK packages. These casts are safe because the runtime
 * behavior is identical — the incompatibility is purely at the TypeScript
 * definition level due to transitive dependency version skew.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import type { SpanProcessor } from '@opentelemetry/sdk-trace-base';

const isProduction = process.env['NODE_ENV'] === 'production';
const serviceName = 'dropservice-platform';
const serviceVersion = process.env['npm_package_version'] || '2.0.0';

/**
 * Initializes OpenTelemetry SDK only when an endpoint is configured.
 * In Vercel, this is typically called from `instrumentation.ts` at the app root.
 */
export function initTelemetry(): NodeSDK | null {
  const endpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT']
    || process.env['OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'];

  if (!endpoint) {
    if (!isProduction) {
      console.log('⚠️ OpenTelemetry: No endpoint configured, skipping initialization.');
    }
    return null;
  }

  const traceExporter: any = new OTLPTraceExporter({ url: `${endpoint}/v1/traces` });

  // Use any to bypass cross-version type incompatibility
  const spanProcessor: any = new BatchSpanProcessor(traceExporter);

  const sdk: any = new NodeSDK({
    serviceName,
    spanProcessors: [spanProcessor],
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown().catch(console.error);
  });

  return sdk;
}

// Auto-initialize when imported
const sdk = initTelemetry();
export default sdk;
