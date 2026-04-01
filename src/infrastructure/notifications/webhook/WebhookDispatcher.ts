// src/infrastructure/notifications/webhook/WebhookDispatcher.ts

import { WebhookSignature } from './WebhookSignature';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { MetricsCollector } from '@/infrastructure/telemetry/MetricsCollector';
import { createClient } from '@supabase/supabase-js';
import { Result, ok, fail } from '@/core/domain/types/result';
import { AppError } from '@/core/shared/AppError';

const supabase = createClient(process.env['NEXT_PUBLIC_SUPABASE_URL']!, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!);

export interface WebhookConfig {
  readonly id: string;
  readonly url: string;
  readonly secret: string;
  readonly active: boolean;
  readonly retry_policy: {
    readonly maxRetries: number;
    readonly backoffMs: number;
    readonly backoffMultiplier: number;
  };
}

export class WebhookDispatcher {
  private readonly logger: StructuredLogger;
  private readonly metrics: MetricsCollector;
  private readonly timeoutMs: number;

  constructor(deps: {
    logger: StructuredLogger;
    metrics: MetricsCollector;
    timeoutMs?: number;
  }) {
    this.logger = deps.logger.child({ component: 'WebhookDispatcher' });
    this.metrics = deps.metrics;
    this.timeoutMs = deps.timeoutMs ?? 30_000;
  }

  async deliver(config: WebhookConfig, event: string, data: Record<string, unknown>): Promise<Result<void, AppError>> {
    const deliveryId = crypto.randomUUID();
    const payloadStr = JSON.stringify({ event, data, deliveryId, timestamp: new Date().toISOString() });

    try {
      const signature = await WebhookSignature.sign(payloadStr, config.secret);

      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': config.id,
          'X-Delivery-ID': deliveryId,
        },
        body: payloadStr,
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        const errorMsg = `Webhook response error: ${response.status}`;
        await this.logDelivery(config.id, event, 'failed', response.status, errorMsg);
        return fail(AppError.internal(errorMsg));
      }

      await this.logDelivery(config.id, event, 'success', response.status);
      this.metrics.recordCounter('notification.webhook.sent', 1);
      return ok(undefined);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown webhook error';
      this.logger.error('Webhook Delivery Failed', new Error(errorMsg), { url: config.url });
      await this.logDelivery(config.id, event, 'failed', 0, errorMsg);
      this.metrics.recordCounter('notification.webhook.failed', 1);
      return fail(AppError.from(error));
    }
  }

  private async logDelivery(webhookId: string, eventType: string, status: string, statusCode: number, error?: string): Promise<void> {
    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhookId,
      event_type: eventType,
      payload: {},
      status,
      status_code: statusCode,
      error,
      attempts: 1,
    });
  }
}
