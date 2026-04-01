/**
 * use-dashboard-refresh — Auto-refresh hook for dashboard data.
 * Provides a manual refresh trigger and optional polling.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseDashboardRefreshOptions {
    /** Polling interval in milliseconds. 0 = disabled. */
    intervalMs?: number;
    /** Whether auto-refresh is enabled. Default: true. */
    enabled?: boolean;
}

interface UseDashboardRefreshReturn {
    /** Manually trigger a page refresh (re-fetches server components). */
    refresh: () => void;
    /** Whether a refresh is currently in progress (visual indicator). */
    isRefreshing: boolean;
    /** Timestamp of last successful refresh. */
    lastRefreshAt: Date | null;
    /** Toggle auto-refresh on/off. */
    toggleAutoRefresh: () => void;
    /** Whether auto-refresh is currently active. */
    isAutoRefreshActive: boolean;
}

/**
 * Hook para auto-refresh de dashboards usando `router.refresh()`.
 * Invalida el caché de Server Components sin navegación completa.
 *
 * @example
 * ```tsx
 * const { refresh, isRefreshing, lastRefreshAt } = useDashboardRefresh({ intervalMs: 30_000 });
 * ```
 */
export function useDashboardRefresh(options: UseDashboardRefreshOptions = {}): UseDashboardRefreshReturn {
    const { intervalMs = 0, enabled = true } = options;
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
    const [isAutoRefreshActive, setIsAutoRefreshActive] = useState(enabled && intervalMs > 0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refresh = useCallback(() => {
        setIsRefreshing(true);
        router.refresh();
        // Simulate a brief "refreshing" state since router.refresh() is instant
        const timer = setTimeout(() => {
            setIsRefreshing(false);
            setLastRefreshAt(new Date());
        }, 500);
        return () => clearTimeout(timer);
    }, [router]);

    const toggleAutoRefresh = useCallback(() => {
        setIsAutoRefreshActive(prev => !prev);
    }, []);

    // Polling effect
    useEffect(() => {
        if (!isAutoRefreshActive || intervalMs <= 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            refresh();
        }, intervalMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isAutoRefreshActive, intervalMs, refresh]);

    return {
        refresh,
        isRefreshing,
        lastRefreshAt,
        toggleAutoRefresh,
        isAutoRefreshActive,
    };
}
