import { cn } from '@/lib/utils';
import React from 'react';

interface LiquidCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
    title?: React.ReactNode;
    headerClassName?: string;
    action?: React.ReactNode;
    noPadding?: boolean;
}

export function LiquidCard({
    children,
    className,
    gradient = false,
    title,
    headerClassName,
    action,
    noPadding = false,
    ...props
}: LiquidCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 group",
                gradient && "bg-gradient-to-br from-indigo-50/60 to-white dark:from-indigo-950/30 dark:to-[#1a1f3d]",
                className
            )}
            {...props}
        >
            {(title || action) && (
                <div className={cn("px-6 py-4 border-b border-border flex items-center justify-between", headerClassName)}>
                    {title && (
                        <div className="font-semibold text-foreground tracking-tight">
                            {title}
                        </div>
                    )}
                    {action && <div>{action}</div>}
                </div>
            )}

            {noPadding ? children : (
                <div className="relative p-6 h-full">
                    {children}
                </div>
            )}
        </div>
    );
}
