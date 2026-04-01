/**
 * PaymentHistory — Server Component showing client's payment records.
 */
import { getClientPaymentHistory } from '@/lib/dashboard/client-data.service';
import { formatCLP } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    expired: 'Expirado',
    pending_review: 'En Revisión',
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
    pending: 'warning',
    processing: 'info',
    approved: 'success',
    rejected: 'neutral',
    cancelled: 'neutral',
    refunded: 'info',
    expired: 'neutral',
    pending_review: 'warning',
};

interface PaymentHistoryProps {
    userId: string;
}

export async function PaymentHistory({ userId }: PaymentHistoryProps) {
    const payments = await getClientPaymentHistory(userId);

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Historial de Pagos</h3>
                    <p className="text-sm text-muted-foreground">{payments.length} transacciones</p>
                </div>
            </div>

            {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tienes pagos registrados aún.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {payments.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{p.serviceName}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="font-mono text-xs text-muted-foreground">{p.quotationCode}</span>
                                        <span className="text-xs text-muted-foreground">{p.gateway}</span>
                                        {p.paidAt && (
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(p.paidAt).toLocaleDateString('es-CL')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-mono font-semibold tabular-nums text-foreground hidden sm:block">
                                    {formatCLP(p.amount)}
                                </span>
                                <Badge variant={STATUS_VARIANT[p.status] ?? 'neutral'}>
                                    {STATUS_LABELS[p.status] ?? p.status}
                                </Badge>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                    <Link href={`/client/quotations/${p.quotationId}`}>
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
