/**
 * PricingSummary V2 — Visual breakdown of quotation pricing margins.
 * Shows provider costs, admin commission, and client totals.
 * Used in admin quotation detail to understand margin structure.
 */
import { formatCLP } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, Users, Receipt, Eye, Percent } from 'lucide-react';

interface PricingSummaryProps {
    /** Provider's total net cost */
    providerTotal: number;
    /** Commission applied by admin (net) */
    commissionTotal: number;
    /** Commission method used */
    commissionMethod: string | null;
    /** Subtotal net (provider + commission) */
    totalNet: number;
    /** IVA amount */
    totalIva: number;
    /** Total with IVA (what client pays) */
    totalWithIva: number;
    /** Services subtotal from provider */
    subtotalServices?: number;
    /** Logistics subtotal from provider */
    subtotalLogistics?: number;
    /** Commission on services */
    commissionServices?: number;
    /** Commission on logistics */
    commissionLogistics?: number;
    /** Whether to show the "client view" preview */
    showClientPreview?: boolean;
}

const COMMISSION_LABELS: Record<string, string> = {
    MONTO_FIJO: 'Monto Fijo',
    PORCENTAJE: 'Porcentaje',
    PORCENTAJE_CATEGORIA: '% por Categoría',
    MIXTO: 'Mixto',
};

export function PricingSummary({
    providerTotal,
    commissionTotal,
    commissionMethod,
    totalNet,
    totalIva,
    totalWithIva,
    subtotalServices = 0,
    subtotalLogistics = 0,
    commissionServices = 0,
    commissionLogistics = 0,
    showClientPreview = true,
}: PricingSummaryProps) {
    const marginPercentage = providerTotal > 0
        ? Math.round((commissionTotal / providerTotal) * 100)
        : 0;

    return (
        <div className="space-y-4">
            {/* Main Pricing Card */}
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                        <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Resumen Financiero</h3>
                        <p className="text-xs text-muted-foreground">
                            Método: {COMMISSION_LABELS[commissionMethod ?? ''] ?? 'Sin definir'}
                        </p>
                    </div>
                </div>

                {/* Provider Costs */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Costos Proveedor</span>
                    </div>

                    {subtotalServices > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Servicios</span>
                            <span className="font-mono tabular-nums text-foreground">{formatCLP(subtotalServices)}</span>
                        </div>
                    )}
                    {subtotalLogistics > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Logística</span>
                            <span className="font-mono tabular-nums text-foreground">{formatCLP(subtotalLogistics)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-1">
                        <span className="text-foreground">Total Proveedor</span>
                        <span className="font-mono tabular-nums text-foreground">{formatCLP(providerTotal)}</span>
                    </div>
                </div>

                {/* Commission */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comisión Admin</span>
                        <span className={cn(
                            'text-xs font-bold px-1.5 py-0.5 rounded-full',
                            marginPercentage >= 30
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
                                : marginPercentage >= 15
                                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'
                        )}>
                            {marginPercentage}%
                        </span>
                    </div>

                    {commissionServices > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Comisión Servicios</span>
                            <span className="font-mono tabular-nums text-emerald-600">{formatCLP(commissionServices)}</span>
                        </div>
                    )}
                    {commissionLogistics > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Comisión Logística</span>
                            <span className="font-mono tabular-nums text-emerald-600">{formatCLP(commissionLogistics)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-1">
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Total Comisión
                        </span>
                        <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatCLP(commissionTotal)}
                        </span>
                    </div>
                </div>

                {/* Totals */}
                <div className="space-y-2 border-t-2 border-indigo-200 dark:border-indigo-800 pt-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal Neto</span>
                        <span className="font-mono tabular-nums text-foreground">{formatCLP(totalNet)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IVA (19%)</span>
                        <span className="font-mono tabular-nums text-foreground">{formatCLP(totalIva)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-1">
                        <span className="text-foreground">Total con IVA</span>
                        <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                            {formatCLP(totalWithIva)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Client Preview */}
            {showClientPreview && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Vista del Cliente
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">El cliente verá</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Sin desglose de comisión ni costos de proveedor
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total a pagar</p>
                            <p className="text-xl font-bold font-mono tabular-nums text-foreground">
                                {formatCLP(totalWithIva)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Margin Health Indicator */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Margen operativo</span>
                        <span className="font-semibold">{marginPercentage}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-500',
                                marginPercentage >= 30
                                    ? 'bg-emerald-500'
                                    : marginPercentage >= 15
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                            )}
                            style={{ width: `${Math.min(marginPercentage, 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
