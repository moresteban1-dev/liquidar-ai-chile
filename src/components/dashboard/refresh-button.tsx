/**
 * RefreshButton — Client Component for manual dashboard refresh.
 * Uses the useDashboardRefresh hook to trigger router.refresh().
 */
'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useDashboardRefresh } from '@/hooks/use-dashboard-refresh';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
    /** Polling interval in ms. Default: 0 (no auto-refresh). */
    intervalMs?: number;
    /** Button variant. */
    variant?: 'outline' | 'ghost' | 'default';
    /** Additional class names. */
    className?: string;
}

export function RefreshButton({
    intervalMs = 0,
    variant = 'outline',
    className,
}: RefreshButtonProps) {
    const { refresh, isRefreshing, lastRefreshAt, toggleAutoRefresh, isAutoRefreshActive } =
        useDashboardRefresh({ intervalMs });

    return (
        <div className="flex items-center gap-2">
            <Button
                variant={variant}
                size="sm"
                onClick={refresh}
                disabled={isRefreshing}
                className={cn('gap-1.5', className)}
            >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
                <span className="hidden sm:inline">
                    {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                </span>
            </Button>

            {lastRefreshAt && (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden md:inline">
                    {lastRefreshAt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </span>
            )}

            {intervalMs > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAutoRefresh}
                    className={cn(
                        'h-6 px-1.5 text-[10px]',
                        isAutoRefreshActive ? 'text-emerald-600' : 'text-muted-foreground'
                    )}
                >
                    {isAutoRefreshActive ? 'Auto ●' : 'Auto ○'}
                </Button>
            )}
        </div>
    );
}
