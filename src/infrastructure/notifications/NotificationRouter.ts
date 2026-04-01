// src/infrastructure/notifications/NotificationRouter.ts

import { INotificationService } from '@/core/application/ports/INotificationService';
import { ChannelNotification, ChannelResult, INotificationChannel } from '@/core/application/ports/INotificationChannel';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';

export class NotificationRouter implements INotificationService {
  private readonly logger: StructuredLogger;
  private readonly channels: Map<string, INotificationChannel> = new Map();

  constructor(deps: { logger: StructuredLogger }) {
    this.logger = deps.logger.child({ component: 'NotificationRouter' });
  }

  registerChannel(channel: INotificationChannel): void {
    this.channels.set(channel.channelType, channel);
  }

  async notify(notification: ChannelNotification): Promise<ChannelResult> {
    const channel = this.channels.get(notification.channel);
    if (!channel) {
      this.logger.warn('No channel registered for type', { type: notification.channel });
      return { channel: notification.channel, status: 'skipped', successCount: 0, failureCount: 0, results: [] };
    }

    this.logger.info('Routing notification', {
      eventType: notification.eventType,
      channel: notification.channel,
      recipients: notification.recipients.length,
    });

    return await channel.send(notification);
  }
}
