import { NotificationPort, ClientNotification, CreateNotificationInput } from '@app/ports/NotificationPort';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

export class SupabaseNotificationAdapter implements NotificationPort {
    async getNotifications(
        userId: string,
        options?: { limit?: number; offset?: number; unreadOnly?: boolean }
    ): Promise<Result<{ notifications: ClientNotification[]; unreadCount: number }, AppError>> {
        try {
            const supabase = createServiceRoleClient();

            let query = supabase
                .from('client_notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (options?.unreadOnly) {
                query = query.eq('is_read', false);
            }

            const limit = options?.limit ?? 20;
            const offset = options?.offset ?? 0;
            query = query.range(offset, offset + limit - 1);

            const [notificationsResult, countResult] = await Promise.all([
                query,
                supabase
                    .from('client_notifications')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('is_read', false),
            ]);

            if (notificationsResult.error) {
                logger.error('Error fetching notifications', notificationsResult.error);
                return fail(AppError.internal(`Notification Error: ${notificationsResult.error.message}`));
            }

            if (countResult.error) {
                logger.error('Error fetching unread count', countResult.error);
                return fail(AppError.internal(`Notification Error: ${countResult.error.message}`));
            }

            return ok({
                notifications: (notificationsResult.data ?? []).map(this.mapRow),
                unreadCount: countResult.count ?? 0,
            });
        } catch (error) {
            return fail(AppError.from(error));
        }
    }

    async getUnreadCount(userId: string): Promise<Result<number, AppError>> {
        try {
            const supabase = createServiceRoleClient();
            const { count, error } = await supabase
                .from('client_notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) {
                logger.error('Error fetching unread count', error);
                return fail(AppError.internal(`Notification Error: ${error.message}`));
            }

            return ok(count ?? 0);
        } catch (error) {
            return fail(AppError.from(error));
        }
    }

    async markAsRead(notificationId: string, userId: string): Promise<Result<void, AppError>> {
        try {
            const supabase = createServiceRoleClient();
            const { error } = await supabase
                .from('client_notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('id', notificationId)
                .eq('user_id', userId);

            if (error) {
                logger.error(`Error marking notification ${notificationId} as read`, error);
                return fail(AppError.internal(`Notification Error: ${error.message}`));
            }

            return ok(undefined);
        } catch (error) {
            return fail(AppError.from(error));
        }
    }

    async markAllAsRead(userId: string): Promise<Result<void, AppError>> {
        try {
            const supabase = createServiceRoleClient();
            const { error } = await supabase
                .from('client_notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) {
                logger.error(`Error marking all notifications as read for user ${userId}`, error);
                return fail(AppError.internal(`Notification Error: ${error.message}`));
            }

            return ok(undefined);
        } catch (error) {
            return fail(AppError.from(error));
        }
    }

    async createNotification(input: CreateNotificationInput): Promise<Result<void, AppError>> {
        try {
            const supabase = createServiceRoleClient();
            const { error } = await supabase
                .from('client_notifications')
                .insert({
                    user_id: input.userId,
                    title: input.title,
                    message: input.message,
                    type: input.type,
                    reference_type: input.referenceType ?? null,
                    reference_id: input.referenceId ?? null,
                    action_url: input.actionUrl ?? null,
                    action_label: input.actionLabel ?? null,
                    icon: input.icon ?? null,
                    priority: input.priority ?? 'NORMAL',
                });

            if (error) {
                logger.error('Error creating notification', error);
                return fail(AppError.internal(`Notification Error: ${error.message}`));
            }

            return ok(undefined);
        } catch (error) {
            return fail(AppError.from(error));
        }
    }

    private mapRow(row: any): ClientNotification {
        return {
            id: row.id,
            title: row.title,
            message: row.message,
            type: row.type,
            referenceType: row.reference_type,
            referenceId: row.reference_id,
            isRead: row.is_read,
            readAt: row.read_at,
            actionUrl: row.action_url,
            actionLabel: row.action_label,
            icon: row.icon,
            priority: row.priority,
            createdAt: row.created_at,
        };
    }
}
