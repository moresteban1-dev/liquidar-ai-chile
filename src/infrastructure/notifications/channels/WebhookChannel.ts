// src/infrastructure/notifications/channels/WebhookChannel.ts

import { INotificationChannel, ChannelNotification, ChannelResult, NotificationChannelType } from '@/core/application/ports/INotificationChannel';
import { WebhookDispatcher, WebhookConfig } from '../webhook/WebhookDispatcher';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export class WebhookChannel implements INotificationChannel {
  readonly channelType: NotificationChannelType = 'webhook';

  private readonly _logger: StructuredLogger;
  private readonly dispatcher: WebhookDispatcher;

  constructor(deps: {
    dispatcher: WebhookDispatcher;
    logger: StructuredLogger;
  }) {
    this.dispatcher = deps.dispatcher;
    this._logger = deps.logger.child({ component: 'WebhookChannel' });
  }

  async send(notification: ChannelNotification): Promise<ChannelResult> {
    // Buscar webhooks activos suscritos al evento
    const { data: webhooks, error } = await getSupabaseClient()
      .from('webhooks')
      .select('*')
      .contains('events', [notification.eventType])
      .eq('active', true);

    if (error || !webhooks || webhooks.length === 0) {
      if (error) this._logger.error('Error fetching webhooks', error);
      return { channel: 'webhook', status: 'skipped', successCount: 0, failureCount: 0, results: [] };
    }

    this._logger.info('Dispatching webhooks', { eventType: notification.eventType, count: webhooks.length });

    const deliverPromises = webhooks.map(async (webhook: any) => {
      await this.dispatcher.deliver(webhook as WebhookConfig, notification.eventType, notification.payload || {});
      return { status: 'sent' as const };
    });

    const results = await Promise.all(deliverPromises);
    return {
      channel: 'webhook',
      status: 'sent',
      successCount: results.length,
      failureCount: 0,
      results: results.map(r => ({ status: r.status as 'sent' | 'failed' | 'skipped' })),
    };
  }
}
