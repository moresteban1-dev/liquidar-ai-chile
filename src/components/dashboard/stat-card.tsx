/**
 * StatCard — Premium KPI card with sparkline, trend indicator, and micro-animations.
 * Server Component compatible (no "use client").
 */

import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/ui/sparkline';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    /** Display label (e.g. "Ingresos Totales") */
    label: string;
    /** Formatted value string (e.g. "$12.500.000") */
    value: string;
    /** Trend percentage (positive = up, negative = down) */
    trend?: number;
    /** Trend label (e.g. "vs mes anterior") */
    trendLabel?: string;
    /** Lucide icon component */
    icon: LucideIcon;
    /** Accent color for icon background and sparkline */
    accent?: "indigo" | "emerald" | "blue" | "amber" | "rose";
    /** Sparkline data points */
    sparklineData?: number[];
    /** Additional className */
    className?: string;
}

const ACCENT_STYLES = {
    indigo: {
        iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        sparkColor: "#6366f1",
    },
    emerald: {
        iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        sparkColor: "#10b981",
    },
    blue: {
        iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
        iconColor: "text-blue-600 dark:text-blue-400",
        sparkColor: "#3b82f6",
    },
    amber: {
        iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
        iconColor: "text-amber-600 dark:text-amber-400",
        sparkColor: "#f59e0b",
    },
    rose: {
        iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
        iconColor: "text-rose-600 dark:text-rose-400",
        sparkColor: "#f43f5e",
    },
} as const;

export function StatCard({
    label,
    value,
    trend,
    trendLabel,
    icon: Icon,
    accent = "indigo",
    sparklineData,
    className,
}: StatCardProps) {
    const styles = ACCENT_STYLES[accent];

    const TrendIcon = trend !== undefined
        ? trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
        : null;

    const trendColor = trend !== undefined
        ? trend > 0 ? "text-emerald-600 dark:text-emerald-400"
            : trend < 0 ? "text-rose-600 dark:text-rose-400"
                : "text-slate-400"
        : "";

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-900/40",
                "bg-white dark:bg-[#1a1f3d] p-5",
                "shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700",
                "transition-all duration-300 group",
                "animate-[fade-in-up_0.4s_ease-out_both]",
                "h-full flex flex-col",
                className
            )}
        >
            {/* Header: Icon + Trend */}
            <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg", styles.iconBg)}>
                    <Icon className={cn("h-5 w-5", styles.iconColor)} />
                </div>
                {TrendIcon && trend !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                        trend > 0 ? "bg-emerald-50 dark:bg-emerald-950/50" :
                            trend < 0 ? "bg-rose-50 dark:bg-rose-950/50" :
                                "bg-muted/50 dark:bg-muted/30",
                        trendColor
                    )}>
                        <TrendIcon className="h-3 w-3" />
                        <span>{trend > 0 ? "+" : ""}{trend}%</span>
                    </div>
                )}
            </div>

            {/* Label */}
            <p className="text-sm text-muted-foreground font-medium mb-1">
                {label}
            </p>

            {/* Value + Sparkline Row */}
            <div className="flex items-end justify-between gap-3">
                <p className="text-2xl font-bold text-foreground tracking-tight font-mono tabular-nums">
                    {value}
                </p>
                {sparklineData && sparklineData.length >= 2 && (
                    <Sparkline
                        data={sparklineData}
                        color={styles.sparkColor}
                        className="opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    />
                )}
            </div>

            {/* Trend Label */}
            {trendLabel && (
                <p className="text-[11px] text-muted-foreground mt-2">
                    {trendLabel}
                </p>
            )}
        </div>
    );
}
