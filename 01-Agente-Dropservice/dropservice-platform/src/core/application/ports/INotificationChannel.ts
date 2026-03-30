import { AppError } from '@/core/shared/AppError';
import { Result } from '@/core/shared/Result';

export type NotificationChannelType = 'email' | 'sms' | 'push' | 'webhook';

export interface NotificationRecipient {
  id: string;
  email?: string;
  phone?: string;
  pushToken?: string;
  name?: string;
}

export interface ChannelNotification {
  channel: NotificationChannelType;
  eventType: string;
  recipients: NotificationRecipient[];
  payload: Record<string, any>;
}

export interface ChannelResult {
  channel: NotificationChannelType;
  status: 'sent' | 'failed' | 'skipped' | 'partial';
  successCount: number;
  failureCount: number;
  results: any[];
}

export interface INotificationChannel {
  readonly channelType: NotificationChannelType;
  send(notification: ChannelNotification): Promise<ChannelResult>;
}
