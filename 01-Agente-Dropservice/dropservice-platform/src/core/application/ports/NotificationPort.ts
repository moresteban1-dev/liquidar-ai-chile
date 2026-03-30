import { Result } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

export interface ClientNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    referenceType: string | null;
    referenceId: string | null;
    isRead: boolean;
    readAt: string | null;
    actionUrl: string | null;
    actionLabel: string | null;
    icon: string | null;
    priority: string;
    createdAt: string;
}

export interface CreateNotificationInput {
    userId: string;
    title: string;
    message: string;
    type: string;
    referenceType?: string;
    referenceId?: string;
    actionUrl?: string;
    actionLabel?: string;
    icon?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface NotificationPort {
    getNotifications(userId: string, options?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<Result<{ notifications: ClientNotification[]; unreadCount: number }, AppError>>;
    getUnreadCount(userId: string): Promise<Result<number, AppError>>;
    markAsRead(notificationId: string, userId: string): Promise<Result<void, AppError>>;
    markAllAsRead(userId: string): Promise<Result<void, AppError>>;
    createNotification(input: CreateNotificationInput): Promise<Result<void, AppError>>;
}
