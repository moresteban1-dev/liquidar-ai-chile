export type NotificationChannelType = 'email' | 'sms' | 'push' | 'webhook';

export interface NotificationRecipient {
  id: string;
  email?: string;
  phone?: string;
  pushToken?: string;
  name?: string;
}

export interface ChannelNotification {
  eventId?: string;
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
