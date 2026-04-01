/**
 * MetricCard Component
 * UI/UX Pro Max: Dashboard KPIs with trend indicators
 * Pattern F: Critical metrics top-left
 */

import { MetricCardProps } from '@/types/ui';
import { Card } from './card';

export function MetricCard({
    title,
    value,
    change,
    icon,
}: MetricCardProps) {
    const trendColors = {
        up: 'text-emerald-600 dark:text-emerald-400',
        down: 'text-red-600 dark:text-red-400',
        neutral: 'text-muted-foreground',
    };

    const trendIcons = {
        up: '↑',
        down: '↓',
        neutral: '→',
    };

    return (
        <Card className="flex items-start gap-4" hover>
            {icon && (
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">
                    {title}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                    {value}
                </p>
                {change && (
                    <p className={`mt-1 text-sm font-medium ${trendColors[change.trend]}`}>
                        {trendIcons[change.trend]} {Math.abs(change.value)}%
                        <span className="text-muted-foreground ml-1">vs last month</span>
                    </p>
                )}
            </div>
        </Card>
    );
}
