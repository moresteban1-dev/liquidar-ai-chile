/**
 * Quick Actions V2 — Action buttons for common admin tasks.
 * Server Component with navigation links.
 */
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Route } from 'next';
import {
    Plus,
    FileText,
    Users,
    Settings,
    BarChart3,
    Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
    label: string;
    href: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

const ACTIONS: QuickAction[] = [
    {
        label: 'Nueva Cotización',
        href: '/admin/quotations',
        icon: Plus,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-500/10 hover:bg-indigo-500/20',
    },
    {
        label: 'Ver Cotizaciones',
        href: '/admin/quotations',
        icon: FileText,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
    },
    {
        label: 'Proveedores',
        href: '/admin/users',
        icon: Users,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    },
    {
        label: 'Catálogo',
        href: '/admin/categories',
        icon: Package,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
    },
    {
        label: 'Reportes',
        href: '/admin/analytics',
        icon: BarChart3,
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-500/10 hover:bg-rose-500/20',
    },
    {
        label: 'Configuración',
        href: '/admin/settings',
        icon: Settings,
        color: 'text-slate-600 dark:text-slate-400',
        bgColor: 'bg-slate-500/10 hover:bg-slate-500/20',
    },
];

export function QuickActions() {
    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Acciones Rápidas</h3>
                <p className="text-sm text-muted-foreground">Accesos directos a funciones clave</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Button
                            key={action.label}
                            variant="ghost"
                            className={cn(
                                'flex flex-col items-center gap-2 h-auto py-4 rounded-lg transition-all',
                                action.bgColor,
                            )}
                            asChild
                        >
                            <Link href={action.href as Route}>
                                <Icon className={cn('h-5 w-5', action.color)} />
                                <span className="text-xs font-medium text-foreground/80">{action.label}</span>
                            </Link>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
