// src/infrastructure/notifications/email/N8NEmailProvider.ts

import { IEmailProvider, EmailSendOptions, EmailResult } from '@/core/application/ports/IEmailProvider';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { MetricsCollector } from '@/infrastructure/telemetry/MetricsCollector';

export class N8NEmailProvider implements IEmailProvider {
  readonly providerName = 'n8n';

  private readonly logger: StructuredLogger;
  private readonly metrics: MetricsCollector;
  private readonly webhookUrl: string;
  private readonly webhookSecret: string;
  private readonly timeoutMs: number;

  constructor(deps: {
    logger: StructuredLogger;
    metrics: MetricsCollector;
    webhookUrl: string;
    webhookSecret: string;
    timeoutMs?: number;
  }) {
    this.logger = deps.logger.child({ component: 'N8NEmailProvider' });
    this.metrics = deps.metrics;
    this.webhookUrl = deps.webhookUrl;
    this.webhookSecret = deps.webhookSecret;
    this.timeoutMs = deps.timeoutMs ?? 15_000;
  }

  async send(options: EmailSendOptions): Promise<EmailResult> {
    const emailId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookSecret}`,
          'X-Email-ID': emailId,
        },
        body: JSON.stringify({ ...options, emailId }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        this.logger.error('N8N response error', new Error(`Status: ${response.status}`));
        this.metrics.recordCounter('notification.email.failed', 1, { provider: 'n8n', reason: 'http_error' });
        return { id: emailId, status: 'failed', provider: this.providerName, error: `N8N response error: ${response.status}`, durationMs };
      }

      this.metrics.recordCounter('notification.email.sent', 1, { provider: 'n8n' });
      return { id: emailId, status: 'sent', provider: this.providerName, sentAt: new Date(), durationMs };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown N8N error';
      this.logger.error('N8N Send Failed', new Error(errorMsg));
      this.metrics.recordCounter('notification.email.failed', 1, { provider: 'n8n' });
      return { id: emailId, status: 'failed', provider: this.providerName, error: errorMsg, durationMs };
    }
  }
}
