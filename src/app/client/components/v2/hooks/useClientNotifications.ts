import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  icon: string | null;
  priority: string;
  createdAt: string;
}

export interface UseClientNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

/**
 * NASA-Grade Engineering: Custom Hook for Client Notifications
 * 
 * Optimized with optimistic UI updates and efficient polling.
 */
export function useClientNotifications(isOpen: boolean): UseClientNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const hasLoaded = useRef(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/client/notifications?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
      hasLoaded.current = true;
    } catch (err) {
      logger.error('[useClientNotifications] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll only the unread count when closed to save bandwidth
  const pollUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/client/notifications?limit=1&unread=true');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      console.warn('[useClientNotifications] Failed to poll unread notifications count', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !hasLoaded.current) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(pollUnreadCount, 60_000);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    pollUnreadCount();
    return () => clearInterval(interval);
  }, [pollUnreadCount]);

  const markAsRead = async (id: string) => {
    // Optimistic Update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const res = await fetch('/api/client/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      if (!res.ok) throw new Error('Failed to mark read');
    } catch (err) {
      // Revert on error
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    const previousNotifications = [...notifications];
    const previousCount = unreadCount;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const res = await fetch('/api/client/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) throw new Error('Failed to mark all read');
    } catch (err) {
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };
}
