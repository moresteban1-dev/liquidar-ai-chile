import { ChannelNotification, ChannelResult, INotificationChannel } from './INotificationChannel';

export interface INotificationService {
  registerChannel(channel: INotificationChannel): void;
  notify(notification: ChannelNotification): Promise<ChannelResult>;
}
