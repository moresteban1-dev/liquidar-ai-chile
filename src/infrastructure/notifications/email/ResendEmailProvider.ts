// src/infrastructure/notifications/email/ResendEmailProvider.ts

import { IEmailProvider, EmailSendOptions, EmailResult } from '@/core/application/ports/IEmailProvider';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { MetricsCollector } from '@/infrastructure/telemetry/MetricsCollector';

export class ResendEmailProvider implements IEmailProvider {
  readonly providerName = 'resend';

  private readonly logger: StructuredLogger;
  private readonly metrics: MetricsCollector;
  private readonly apiKey: string;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly timeoutMs: number;

  constructor(deps: {
    logger: StructuredLogger;
    metrics: MetricsCollector;
    apiKey: string;
    fromAddress: string;
    fromName?: string;
    timeoutMs?: number;
  }) {
    this.logger = deps.logger.child({ component: 'ResendEmailProvider' });
    this.metrics = deps.metrics;
    this.apiKey = deps.apiKey;
    this.fromAddress = deps.fromAddress;
    this.fromName = deps.fromName ?? 'Liquidar.cl Platform';
    this.timeoutMs = deps.timeoutMs ?? 10_000;
  }

  async send(options: EmailSendOptions): Promise<EmailResult> {
    const emailId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromAddress}>`,
          to: options.to.map((r: { email: string }) => r.email),
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        const errorMsg = `Resend response error: ${JSON.stringify(errorData)}`;
        this.logger.error('Resend Send Failed (API Error)', new Error(errorMsg));
        this.metrics.recordCounter('notification.email.failed', 1, { provider: 'resend' });
        return { id: emailId, status: 'failed', provider: this.providerName, error: errorMsg, durationMs };
      }

      this.metrics.recordCounter('notification.email.sent', 1, { provider: 'resend' });
      return { id: emailId, status: 'sent', provider: this.providerName, sentAt: new Date(), durationMs };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown Resend error';
      this.logger.error('Resend Send Failed (Network Error)', new Error(errorMsg));
      this.metrics.recordCounter('notification.email.failed', 1, { provider: 'resend' });
      return { id: emailId, status: 'failed', provider: this.providerName, error: errorMsg, durationMs };
    }
  }
}
