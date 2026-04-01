/**
 * VendorPaymentHistory — RSC component showing vendor's received payments.
 */
import { getVendorPaymentHistory } from '@/lib/dashboard/vendor-data.service';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ArrowRight } from 'lucide-react';
import { formatCLP, formatDateShort } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
    PAID: 'Pagado',
    FULFILLED: 'Cumplido',
    COMPLETED: 'Completado',
};

export async function VendorPaymentHistory() {
    const payments = await getVendorPaymentHistory();

    const totalEarned = payments.reduce((s, p) => s + p.amount, 0);

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-lg font-semibold text-foreground">Historial de Ingresos</h3>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">{payments.length} pagos recibidos</p>
                    {totalEarned > 0 && (
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCLP(totalEarned)}</p>
                    )}
                </div>
            </div>

            {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Aún no tienes pagos registrados.</p>
                    <p className="text-xs mt-1">Completa oportunidades para generar ingresos.</p>
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">{p.serviceName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-[10px] text-muted-foreground">{p.quotationCode}</span>
                                    {p.paidAt && (
                                        <span className="text-xs text-muted-foreground">
                                            {formatDateShort(p.paidAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {formatCLP(p.amount)}
                                </span>
                                <Badge variant="success" className="text-[10px]">
                                    {STATUS_LABELS[p.status] ?? p.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {payments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1" asChild>
                        <Link href="/vendor/orders">
                            Ver todos los pedidos <ArrowRight className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
