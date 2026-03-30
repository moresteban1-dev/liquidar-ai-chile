// src/infrastructure/notifications/email/ResilientEmailProvider.ts

import { IEmailProvider, EmailSendOptions, EmailResult } from '@/core/application/ports/services/IEmailProvider';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { MetricsCollector } from '@/infrastructure/telemetry/MetricsCollector';

export class ResilientEmailProvider implements IEmailProvider {
  readonly providerName = 'resilient';

  private readonly logger: StructuredLogger;
  private readonly metrics: MetricsCollector;
  private readonly primary: IEmailProvider;
  private readonly fallback: IEmailProvider;

  constructor(deps: {
    primary: IEmailProvider;
    fallback: IEmailProvider;
    logger: StructuredLogger;
    metrics: MetricsCollector;
  }) {
    this.primary = deps.primary;
    this.fallback = deps.fallback;
    this.logger = deps.logger.child({ component: 'ResilientEmailProvider' });
    this.metrics = deps.metrics;
  }

  async send(options: EmailSendOptions): Promise<EmailResult> {
    const primaryResult = await this.primary.send(options);

    if (primaryResult.status === 'sent') {
      return primaryResult;
    }

    this.logger.warn('Primary email provider failed, calling fallback', {
      primary: this.primary.providerName,
      error: primaryResult.error,
    });

    this.metrics.recordCounter('notification.email.fallback_trigger', 1, {
      from: this.primary.providerName,
      to: this.fallback.providerName,
    });

    const fallbackResult = await this.fallback.send(options);

    if (fallbackResult.status === 'sent') {
      this.logger.info('Fallback email provider succeeded');
    } else {
      this.logger.error('All email providers failed', new Error(fallbackResult.error || 'Unknown error'), {
        primaryError: primaryResult.error,
        fallbackError: fallbackResult.error,
      });
    }

    return fallbackResult;
  }
}
