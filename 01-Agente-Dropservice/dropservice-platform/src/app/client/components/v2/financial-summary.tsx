/**
 * FinancialSummary — Server Component with aggregate payment stats.
 */
import { getClientFinancialSummary } from '@/lib/dashboard/client-data.service';
import { formatCLP } from '@/lib/formatters';
import { DollarSign, Clock, TrendingUp, Calendar } from 'lucide-react';

interface FinancialSummaryProps {
    userId: string;
}

export async function FinancialSummaryWidget({ userId }: FinancialSummaryProps) {
    const summary = await getClientFinancialSummary(userId);

    const cards = [
        {
            label: 'Total Pagado',
            value: formatCLP(summary.totalPaid),
            icon: DollarSign,
            color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
        },
        {
            label: 'Pagos Pendientes',
            value: formatCLP(summary.totalPending),
            icon: Clock,
            color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
        },
        {
            label: 'Transacciones',
            value: String(summary.paymentCount),
            icon: TrendingUp,
            color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
        },
        {
            label: 'Último Pago',
            value: summary.lastPaymentDate
                ? new Date(summary.lastPaymentDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
                : 'N/A',
            icon: Calendar,
            color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
        },
    ];

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Resumen Financiero</h3>

            <div className="grid grid-cols-2 gap-3">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/5"
                    >
                        <div className={`flex items-center justify-center h-10 w-10 rounded-xl shrink-0 ${card.color}`}>
                            <card.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{card.label}</p>
                            <p className="text-sm font-semibold tabular-nums text-foreground truncate">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
