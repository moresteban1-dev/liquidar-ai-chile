/**
 * Client Active Quotations V2 — Pending quotations requiring attention.
 */
import { getClientActiveQuotations } from '@/lib/dashboard/client-data.service';
import { formatCLP, formatDateShort } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertCircle, HardHat } from 'lucide-react';
import Link from 'next/link';

const PUBLIC_STATUS_LABELS: Record<string, string> = {
    SOLICITADA: 'Solicitada',
    RECIBIDA: 'Recibida',
    EN_PROCESO: 'En Proceso',
    EN_EVALUACION: 'En Evaluación',
    EN_REVISION: 'En Revisión',
    COTIZADA: 'Cotizada',
};

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = {
    SOLICITADA: 'neutral',
    RECIBIDA: 'info',
    EN_PROCESO: 'info',
    EN_EVALUACION: 'info',
    EN_REVISION: 'warning',
    COTIZADA: 'success',
};

interface ActiveQuotationsProps {
    userId: string;
}

export async function ClientActiveQuotations({ userId }: ActiveQuotationsProps) {
    const quotations = await getClientActiveQuotations(userId);

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Cotizaciones en Proceso</h3>
                    <p className="text-sm text-muted-foreground">{quotations.length} activas</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/client/quotations">
                        Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </div>

            {quotations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                    No tienes cotizaciones activas.
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {quotations.map((q) => (
                        <div
                            key={q.id}
                            className="flex items-center justify-between py-3 gap-3 group"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground truncate">{q.serviceName}</p>
                                    {q.requiresAction && (
                                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded-full">
                                            <AlertCircle className="h-2.5 w-2.5" />
                                            Acción requerida
                                        </span>
                                    )}
                                    {q.technicalVisitSuggested && (
                                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full">
                                            <HardHat className="h-2.5 w-2.5" />
                                            Visita Técnica
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-xs text-muted-foreground">{q.code}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDateShort(q.createdAt)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-mono font-semibold tabular-nums text-foreground hidden sm:block">
                                    {q.amount > 0 ? formatCLP(q.amount) : '--'}
                                </span>
                                <Badge variant={STATUS_VARIANT[q.publicStatus] ?? 'neutral'}>
                                    {PUBLIC_STATUS_LABELS[q.publicStatus] ?? q.publicStatus}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    asChild
                                >
                                    <Link href={`/client/quotations/${q.id}`}>
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
