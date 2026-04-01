import { Suspense } from 'react';
import { getAdminAnalyticsData } from '@/lib/dashboard/admin-data.service';
import { formatCLP } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Activity, Clock, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';

const RevenueBarChart = dynamic(
    () => import('../components/analytics-charts').then(mod => mod.RevenueBarChart),
    { loading: () => <div className="h-[350px] w-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Cargando gráfico...</div> }
);

const StatusPieChart = dynamic(
    () => import('../components/analytics-charts').then(mod => mod.StatusPieChart),
    { loading: () => <div className="h-[350px] w-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Cargando gráfico...</div> }
);

// ─── Skeleton for Suspense Fallback ────────────────────────
function AnalyticsSkeleton() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[400px] bg-muted rounded-xl" />
                <div className="h-[400px] bg-muted rounded-xl" />
            </div>
        </div>
    );
}

// ─── RSC Data Component ────────────────────────────────────
async function AnalyticsContent() {
    const data = await getAdminAnalyticsData();

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard Analítico</h1>
                <p className="text-muted-foreground mt-2 text-lg">Visión general del rendimiento de tu negocio</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card/50 border-border backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:border-indigo-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Totales</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{formatCLP(data.metrics.totalRevenue)}</div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1 font-medium">
                            <TrendingUp className="h-3 w-3 mr-1" />Histórico
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-border backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:border-indigo-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Órdenes Totales</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{data.metrics.totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1">Órdenes procesadas</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-border backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:border-indigo-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">En Proceso</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{data.metrics.activeOrders}</div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">Actualmente activas</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 border-border backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:border-indigo-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes de Pago</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{data.metrics.pendingOrders}</div>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">Requieren atención</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="col-span-1 bg-card/50 border-border backdrop-blur-sm shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">Ingresos (Últimos 6 Meses)</CardTitle>
                        <CardDescription className="text-muted-foreground">Tendencia de facturación mensual</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] pl-0">
                        <RevenueBarChart data={data.charts.revenue} />
                    </CardContent>
                </Card>

                <Card className="col-span-1 bg-card/50 border-border backdrop-blur-sm shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">Distribución de Órdenes</CardTitle>
                        <CardDescription className="text-muted-foreground">Estado actual de todos los pedidos</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <StatusPieChart data={data.charts.status} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ─── Page Export (RSC Pattern) ──────────────────────────────
export default function AnalyticsPage() {
    return (
        <Suspense fallback={<AnalyticsSkeleton />}>
            <AnalyticsContent />
        </Suspense>
    );
}
