import { Suspense } from 'react';
import Link from 'next/link';
import { getAdminFinanceData } from '@/lib/dashboard/admin-data.service';
import dynamic from 'next/dynamic';

const RevenueChart = dynamic(
    () => import('@/components/admin/FinanceGraphs').then(mod => mod.RevenueChart),
    { loading: () => <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Cargando gráfico...</div> }
);

const MarginChart = dynamic(
    () => import('@/components/admin/FinanceGraphs').then(mod => mod.MarginChart),
    { loading: () => <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Cargando gráfico...</div> }
);
import { formatCLP } from '@/lib/quotation-fsm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// ─── Skeleton for Suspense Fallback ────────────────────────
function FinanceSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-pulse">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-80 bg-muted rounded-xl" />
                <div className="h-80 bg-muted rounded-xl" />
            </div>
        </div>
    );
}

// ─── RSC Data Component ────────────────────────────────────
async function FinanceContent() {
    const stats = await getAdminFinanceData();

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Tablero Financiero</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Resumen de ingresos, egresos y márgenes operativos.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">
                        Actualizado hoy
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card/50 border-border backdrop-blur-sm hover:border-indigo-500/50 transition-colors group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatCLP(stats.totals.revenue)}</div>
                        <div className="flex items-center mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            <span className="font-medium">Volumen bruto</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border backdrop-blur-sm hover:border-indigo-500/50 transition-colors group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Costos Proveedores</CardTitle>
                        <Users className="h-4 w-4 text-orange-500 group-hover:text-orange-400 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatCLP(stats.totals.cost)}</div>
                        <div className="flex items-center mt-1 text-xs text-orange-600 dark:text-orange-400">
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                            <span className="font-medium">Pagos a terceros</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border backdrop-blur-sm hover:border-indigo-500/50 transition-colors group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Margen Neto</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500 group-hover:text-purple-400 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCLP(stats.totals.margin)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {((stats.totals.margin / stats.totals.revenue || 0) * 100).toFixed(1)}% de rentabilidad
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border backdrop-blur-sm hover:border-indigo-500/50 transition-colors group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Transacciones</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-500 group-hover:text-blue-400 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stats.totals.count}</div>
                        <p className="text-xs text-muted-foreground mt-1">Órdenes procesadas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="col-span-1 bg-card/50 border-border backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-foreground">Historial de Ventas vs Costos</CardTitle>
                        <CardDescription className="text-muted-foreground">Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <RevenueChart data={stats.chartData} />
                    </CardContent>
                </Card>
                <Card className="col-span-1 bg-card/50 border-border backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-foreground">Margen Operativo</CardTitle>
                        <CardDescription className="text-muted-foreground">Rentabilidad neta mensual</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <MarginChart data={stats.chartData} />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-foreground">Últimas Transacciones</CardTitle>
                    <CardDescription className="text-muted-foreground">Pagos procesados recientemente</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto rounded-lg">
                        <table className="w-full text-sm text-left text-muted-foreground">
                            <thead className="text-xs text-foreground/80 uppercase bg-muted/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">ID Orden</th>
                                    <th scope="col" className="px-6 py-3">Fecha</th>
                                    <th scope="col" className="px-6 py-3">Monto</th>
                                    <th scope="col" className="px-6 py-3">Estado</th>
                                    <th scope="col" className="px-6 py-3">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {stats.recentTransactions.map((tx) => (
                                    <tr key={tx.id} className="bg-transparent hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-foreground whitespace-nowrap">
                                            {tx.id.substring(0, 8)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(tx.date).toLocaleDateString('es-CL')}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-foreground">
                                            {formatCLP(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={
                                                tx.status === 'DELIVERED' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' :
                                                    tx.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' :
                                                        'bg-muted text-muted-foreground border-border'
                                            }>
                                                {tx.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/orders`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                                Ver
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {stats.recentTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            No hay transacciones recientes
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Page Export (RSC Pattern) ──────────────────────────────
export default function AdminFinancePage() {
    return (
        <Suspense fallback={<FinanceSkeleton />}>
            <FinanceContent />
        </Suspense>
    );
}
