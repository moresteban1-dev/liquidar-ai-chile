import { INotificationChannel, ChannelNotification, ChannelResult, NotificationChannelType, NotificationRecipient } from '@/core/application/ports/INotificationChannel';
import { IEmailProvider, EmailRecipient } from '@/core/application/ports/IEmailProvider';
import { TemplateEngine } from '../email/TemplateEngine';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { MetricsCollector } from '@/infrastructure/telemetry/MetricsCollector';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return createClient(supabaseUrl, supabaseKey);
}

export class EmailChannel implements INotificationChannel {
  readonly channelType: NotificationChannelType = 'email';

  private readonly provider: IEmailProvider;
  private readonly templateEngine: TemplateEngine;
  private readonly logger: StructuredLogger;
  private readonly metrics: MetricsCollector;

  constructor(deps: {
    provider: IEmailProvider;
    templateEngine: TemplateEngine;
    logger: StructuredLogger;
    metrics: MetricsCollector;
  }) {
    this.provider = deps.provider;
    this.templateEngine = deps.templateEngine;
    this.logger = deps.logger.child({ component: 'EmailChannel' });
    this.metrics = deps.metrics;
  }

  async send(notification: ChannelNotification): Promise<ChannelResult> {
    const recipients = notification.recipients;
    if (!recipients || recipients.length === 0) {
      this.logger.warn('Email notification skipped: No recipients');
      return { channel: 'email', status: 'skipped', successCount: 0, failureCount: 0, results: [] };
    }

    try {
      const templateVars: any = notification.payload || {};
      const templateResult = await this.templateEngine.resolve(
        notification.eventType,
        templateVars
      );

      if (templateResult.isFailure()) {
        this.logger.error('Failed to resolve email template', new Error(templateResult.getError().message));
        return { channel: 'email', status: 'failed', successCount: 0, failureCount: 1, results: [] };
      }

      const { subject, html } = templateResult.getValue();

      const emailRecipients: EmailRecipient[] = recipients
        .filter((r: NotificationRecipient) => !!r.email)
        .map((r: NotificationRecipient) => {
          const recipient: any = { email: r.email! };
          if (r.name) recipient.name = r.name;
          return recipient as EmailRecipient;
        });

      if (emailRecipients.length === 0) {
        this.logger.warn('Email notification skipped: No recipients with valid email');
        return { channel: 'email', status: 'skipped', successCount: 0, failureCount: 0, results: [] };
      }

      const startTime = Date.now();
      const result = await this.provider.send({
        to: emailRecipients,
        subject,
        html,
      });
      const durationMs = Date.now() - startTime;

      // Auditoría en base de datos
      await this.logNotification(notification, { ...result, durationMs });

      const success = result.status === 'sent';
      
      if (success) {
        this.metrics.recordCounter('notification.email.sent', 1, { provider: result.provider });
      } else {
        this.metrics.recordCounter('notification.email.failed', 1, { provider: result.provider });
      }

      const individualResult: any = {
        status: success ? 'sent' : 'failed',
        provider: result.provider,
        durationMs,
      };

      if (recipients[0]?.id) individualResult.recipientId = recipients[0].id;
      if (recipients[0]?.email) individualResult.recipientEmail = recipients[0].email;
      if (result.error) individualResult.error = result.error;

      return {
        channel: 'email',
        status: success ? 'sent' : 'failed',
        successCount: success ? 1 : 0,
        failureCount: success ? 0 : 1,
        results: [individualResult],
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown email channel error';
      this.logger.error('Email Channel Failed', new Error(errorMsg));
      return { 
        channel: 'email', 
        status: 'failed', 
        successCount: 0, 
        failureCount: 1, 
        results: [{
          recipientId: notification.recipients?.[0]?.id,
          recipientEmail: notification.recipients?.[0]?.email,
          status: 'failed',
          provider: 'unknown',
          error: errorMsg,
          durationMs: 0
        }] 
      };
    }
  }

  private async logNotification(notification: ChannelNotification, result: any): Promise<void> {
    try {
      const logData: any = {
        event_type: notification.eventType,
        channel: 'email',
        recipient_id: notification.recipients?.[0]?.id,
        status: result.status,
        provider: result.provider,
        metadata: {
          payload: notification.payload,
          duration_ms: result.durationMs,
        },
      };

      if (result.error) logData.error_message = result.error;

      await getSupabaseClient().from('notification_log').insert(logData);
    } catch (err) {
      const errorStr = err instanceof Error ? err.message : 'Unknown log error';
      this.logger.error('Failed to log notification', new Error(errorStr));
    }
  }
}
