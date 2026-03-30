/**
 * Recent Quotations V2 — Server Component table showing latest quotations.
 * Enhanced with client info, event dates, and visual status badges.
 */
import { getAdminRecentQuotationsV2 } from '@/lib/dashboard/admin-data.service';
import { formatCLP, formatDateShort } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
    PENDING_ASSIGNMENT: 'Sin Asignar',
    PENDING_PROVIDER_BID: 'Esperando Proveedor',
    PENDING_ADMIN_APPROVAL: 'Revisión Admin',
    AWAITING_CLIENT_PAYMENT: 'Esperando Pago',
    APPROVED: 'Aprobada',
    PAID: 'Pagada',
    FULFILLED: 'Completada',
    CANCELLED: 'Cancelada',
    REJECTED: 'Rechazada',
    DRAFT: 'Borrador',
};

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = {
    PENDING_ASSIGNMENT: 'warning',
    PENDING_PROVIDER_BID: 'info',
    PENDING_ADMIN_APPROVAL: 'info',
    AWAITING_CLIENT_PAYMENT: 'warning',
    APPROVED: 'success',
    PAID: 'success',
    FULFILLED: 'success',
    CANCELLED: 'neutral',
    REJECTED: 'neutral',
    DRAFT: 'neutral',
};

export async function RecentQuotations() {
    const quotations = await getAdminRecentQuotationsV2();

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Cotizaciones Recientes</h3>
                    <p className="text-sm text-muted-foreground">{quotations.length} registros</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/quotations">
                        Ver todas <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </div>

            {quotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No hay cotizaciones recientes.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left py-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="text-left py-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="text-left py-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                                    Servicio
                                </th>
                                <th className="text-right py-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Monto
                                </th>
                                <th className="text-center py-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="text-right py-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                                    Fecha
                                </th>
                                <th className="py-2 px-1 w-10" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {quotations.map((q) => (
                                <tr key={q.id} className="group hover:bg-muted/30 transition-colors">
                                    <td className="py-2.5 px-1">
                                        <span className="font-mono text-xs text-muted-foreground">{q.code}</span>
                                    </td>
                                    <td className="py-2.5 px-1">
                                        <div>
                                            <p className="font-medium text-foreground text-sm">{q.clientName}</p>
                                            <p className="text-xs text-muted-foreground">{q.clientEmail}</p>
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-1 hidden md:table-cell">
                                        <span className="text-foreground/80 text-sm">{q.serviceName}</span>
                                    </td>
                                    <td className="py-2.5 px-1 text-right">
                                        <span className="font-mono font-semibold tabular-nums text-foreground">
                                            {q.amount > 0 ? formatCLP(q.amount) : '--'}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-1 text-center">
                                        <Badge variant={STATUS_VARIANT[q.status] ?? 'neutral'}>
                                            {STATUS_LABELS[q.status] ?? q.status}
                                        </Badge>
                                    </td>
                                    <td className="py-2.5 px-1 text-right hidden sm:table-cell">
                                        <span className="text-xs text-muted-foreground">
                                            {formatDateShort(q.createdAt)}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-1 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            asChild
                                        >
                                            <Link href={`/admin/quotations/${q.id}`}>
                                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
