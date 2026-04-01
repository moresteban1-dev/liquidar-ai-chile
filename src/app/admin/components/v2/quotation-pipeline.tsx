/**
 * Quotation Pipeline — Visual Kanban-style pipeline showing quotation flow.
 * Server Component fetching pipeline data from AdminDataService.
 */
import { getAdminPipeline } from '@/lib/dashboard/admin-data.service';
import { formatCLP } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Clock,
    UserPlus,
    FileCheck,
    CreditCard,
    CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STAGE_ICONS: Record<string, LucideIcon> = {
    pending_assignment: Clock,
    pending_bid: UserPlus,
    pending_approval: FileCheck,
    awaiting_payment: CreditCard,
    completed: CheckCircle2,
};

const STAGE_COLORS: Record<string, string> = {
    amber: 'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20',
    blue: 'border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20',
    indigo: 'border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20',
    emerald: 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20',
    green: 'border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/20',
};

const STAGE_ICON_COLORS: Record<string, string> = {
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    green: 'text-green-600 dark:text-green-400',
};

const BADGE_COLORS: Record<string, 'warning' | 'info' | 'neutral' | 'success'> = {
    amber: 'warning',
    blue: 'info',
    indigo: 'info',
    emerald: 'success',
    green: 'success',
};

export async function QuotationPipeline() {
    const { stages, quotations } = await getAdminPipeline();

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Pipeline de Cotizaciones</h3>
                    <p className="text-sm text-muted-foreground">
                        {quotations.length} cotizaciones activas en el flujo
                    </p>
                </div>
            </div>

            {/* Stage Summary Bar */}
            <div className="grid grid-cols-5 gap-2 mb-5">
                {stages.map((stage) => {
                    const Icon = STAGE_ICONS[stage.id] ?? Clock;
                    return (
                        <div
                            key={stage.id}
                            className={cn(
                                'rounded-lg border p-3 text-center transition-all hover:shadow-sm',
                                STAGE_COLORS[stage.color]
                            )}
                        >
                            <Icon className={cn('h-4 w-4 mx-auto mb-1', STAGE_ICON_COLORS[stage.color])} />
                            <p className="text-xs font-medium text-muted-foreground truncate">{stage.label}</p>
                            <p className="text-xl font-bold text-foreground tabular-nums">{stage.count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Items in Pipeline */}
            {quotations.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Últimas cotizaciones
                    </p>
                    <div className="divide-y divide-border/50">
                        {quotations.slice(0, 8).map((q) => {
                            const stage = stages.find(s => (s.statuses as string[]).includes(q.status));
                            return (
                                <div key={q.id} className="flex items-center justify-between py-2.5 gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                                            {q.code}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {q.clientName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {q.serviceName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-sm font-mono font-semibold tabular-nums text-foreground">
                                            {q.totalAmount > 0 ? formatCLP(q.totalAmount) : '--'}
                                        </span>
                                        <Badge variant={BADGE_COLORS[stage?.color ?? 'neutral'] ?? 'neutral'}>
                                            {stage?.label ?? q.status}
                                        </Badge>
                                        {q.daysInStage > 3 && (
                                            <span className="text-xs text-rose-500 font-semibold">
                                                {q.daysInStage}d
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {quotations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No hay cotizaciones activas en el pipeline.
                </div>
            )}
        </div>
    );
}
