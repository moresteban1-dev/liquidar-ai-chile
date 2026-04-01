import { useState, useEffect, useCallback } from 'react';

export interface NotifEntry {
  id: string;
  event_type: string;
  channel: string;
  recipient_email: string | null;
  template_id: string | null;
  status: string;
  provider: string | null;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface UseNotificationLogsResult {
  entries: NotifEntry[];
  loading: boolean;
  total: number;
  page: number;
  setPage: (page: number | ((p: number) => number)) => void;
  filter: { channel: string; status: string };
  setFilter: (filter: { channel: string; status: string } | ((f: { channel: string; status: string }) => { channel: string; status: string })) => void;
  refresh: () => void;
}

/**
 * NASA-Grade Engineering: Custom Hook for Notification Logs
 * 
 * Optimized for performance and reusability.
 */
export function useNotificationLogs(): UseNotificationLogsResult {
  const [entries, setEntries] = useState<NotifEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ channel: '', status: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '20');
      params.set('offset', String((page - 1) * 20));
      if (filter.channel) params.set('channel', filter.channel);
      if (filter.status) params.set('status', filter.status);

      const response = await fetch(`/api/admin/notifications?${params}`);
      const json = await response.json();
      
      if (json.success) {
        setEntries(json.data.notifications ?? []);
        setTotal(json.data.total ?? 0);
      }
    } catch (error) {
      console.error('Error fetching notification logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    entries,
    loading,
    total,
    page,
    setPage,
    filter,
    setFilter,
    refresh: fetchLogs
  };
}
