/**
 * DashboardHeader — Reusable header for all dashboard roles.
 * Shows dynamic greeting based on time of day, subtitle, and action buttons.
 */

import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
    /** User-facing name (e.g. "Admin", "Proveedor", "Cliente") */
    name: string;
    /** Subtitle text */
    subtitle: string;
    /** Optional action buttons */
    actions?: React.ReactNode;
    className?: string;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
}

function getFormattedDate(): string {
    return new Intl.DateTimeFormat("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date());
}

export function DashboardHeader({
    name,
    subtitle,
    actions,
    className,
}: DashboardHeaderProps) {
    const greeting = getGreeting();
    const today = getFormattedDate();

    return (
        <div className={cn(
            "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8",
            "animate-[fade-in-up_0.3s_ease-out_both]",
            className
        )}>
            <div>
                <p className="text-sm text-muted-foreground font-medium capitalize">
                    {today}
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1">
                    {greeting}, {name}
                </h1>
                <p className="text-muted-foreground mt-0.5 text-sm">
                    {subtitle}
                </p>
            </div>
            {actions && (
                <div className="flex gap-2 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
