/**
 * Catalog Stats V2 — Server Component showing catalog health metrics.
 * Displays total items, active items, categories, and utilization rate.
 */
import { getAdminCatalogStats } from '@/lib/dashboard/admin-data.service';
import { cn } from '@/lib/utils';
import { Package, CheckCircle2, FolderOpen, Activity } from 'lucide-react';

export async function CatalogStats() {
    const stats = await getAdminCatalogStats();

    const metrics = [
        {
            label: 'Ítems Totales',
            value: stats.totalItems,
            icon: Package,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/10',
        },
        {
            label: 'Ítems Activos',
            value: stats.activeItems,
            icon: CheckCircle2,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
        },
        {
            label: 'Categorías',
            value: stats.categoriesCount,
            icon: FolderOpen,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
        },
        {
            label: 'Utilización',
            value: `${stats.utilizationRate}%`,
            icon: Activity,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
        },
    ];

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Catálogo V2</h3>
                <p className="text-sm text-muted-foreground">Estado del catálogo de servicios</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {metrics.map((m) => {
                    const Icon = m.icon;
                    return (
                        <div
                            key={m.label}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
                        >
                            <div className={cn('p-2 rounded-lg', m.bg)}>
                                <Icon className={cn('h-4 w-4', m.color)} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{m.label}</p>
                                <p className="text-lg font-bold text-foreground tabular-nums">
                                    {m.value}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Utilization Progress Bar */}
            <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Utilización del catálogo</span>
                    <span className="font-semibold">{stats.utilizationRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${stats.utilizationRate}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
