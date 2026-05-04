import { useState, useEffect, useCallback } from 'react';

export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version: string;
  components: Array<{
    name: string;
    status: string;
    latencyMs: number;
    details?: Record<string, unknown>;
  }>;
  metrics: {
    memory: { heapUsedMB: number; heapTotalMB: number; heapUsagePercent: number };
    cache: { size: number; hitRate: number; memoryMB: number };
    database: { latencyMs: number; cacheHitRatio: number };
    notifications: { sent24h: number; failed24h: number; successRate: number };
    events: { pending: number; processing: number; dead: number };
  };
}

export interface UseSystemHealthResult {
  data: HealthData | null;
  loading: boolean;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  refresh: () => void;
}

/**
 * NASA-Grade Engineering: Custom Hook for System Health Monitoring
 * 
 * Optimized with interval management and manual refresh.
 */
export function useSystemHealth(): UseSystemHealthResult {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/system/health');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHealth();
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 15_000);
    return () => clearInterval(interval);
  }, [fetchHealth, autoRefresh]);

  return {
    data,
    loading,
    autoRefresh,
    setAutoRefresh,
    refresh: fetchHealth
  };
}
