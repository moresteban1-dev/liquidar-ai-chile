import { NextResponse, type NextRequest } from 'next/server';
import { getContainer } from '@/infrastructure/di/Container';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { withAuth, type AuthUser } from '@/lib/api/with-auth';

/**
 * GET handler to fetch client-specific notifications from Supabase
 * mapped to the ViewModel expected by useClientNotifications hook.
 */
export const GET = withAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    const container = await getContainer();
    const supabase = await container.resolve<any>('supabase');
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const unreadOnly = searchParams.get('unread') === 'true';

    // 1. Query notifications
    let query = supabase
      .from('client_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notificationsData, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      logger.error('[GET /api/client/notifications] Fetch error:', fetchError);
      throw fetchError;
    }

    // 2. Query unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('client_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (countError) {
      logger.error('[GET /api/client/notifications] Count error:', countError);
      throw countError;
    }

    // 3. Map to ViewModel format required by hook
    const notifications = (notificationsData ?? []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read,
      actionUrl: n.action_url ?? null,
      actionLabel: n.action_label ?? null,
      icon: n.icon ?? null,
      priority: n.priority ?? 'NORMAL',
      createdAt: n.created_at,
    }));

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount ?? 0,
    });
  } catch (error) {
    logger.error('Error in GET /api/client/notifications:', error as Error);
    return NextResponse.json(
      { error: 'Error al cargar notificaciones' },
      { status: 500 }
    );
  }
});

/**
 * PATCH handler to mark individual notifications or all notifications as read.
 */
export const PATCH = withAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    const container = await getContainer();
    const supabase = await container.resolve<any>('supabase');

    const body = await request.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    if (markAll === true) {
      // Mark all user notifications as read
      const { error } = await supabase
        .from('client_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        logger.error('[PATCH /api/client/notifications] Mark all error:', error);
        throw error;
      }
    } else if (notificationId) {
      // Mark single notification as read
      const { error } = await supabase
        .from('client_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        logger.error('[PATCH /api/client/notifications] Mark single error:', error);
        throw error;
      }
    } else {
      return NextResponse.json(
        { error: 'Bad Request', message: 'notificationId or markAll is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in PATCH /api/client/notifications:', error as Error);
    return NextResponse.json(
      { error: 'Error al actualizar notificaciones' },
      { status: 500 }
    );
  }
});
