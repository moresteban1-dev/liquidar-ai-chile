import { Suspense } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCLP, formatDateShort } from '@/lib/formatters';
import {
    DollarSign,
    FileText,
    ArrowRight,
    Package,
    Star,
    Clock,
    AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import {
    getVendorKpisV2,
    getVendorOpportunities,
    getVendorActiveOrders,
    getVendorPerformanceMetrics,
} from '@/lib/dashboard/vendor-data.service';
import { AnalyticsSkeleton, RecentAnalysesSkeleton } from '@/components/skeletons';
import { VendorPaymentHistory } from './components/vendor-payment-history';
import { VendorFeedbackReceived } from './components/vendor-feedback-received';
import { VendorPerformancePanel } from './components/vendor-performance-panel';
import { VendorOnboarding } from './components/vendor-onboarding';

export const dynamic = 'force-dynamic';

// ============================================
// KPI Icons
// ============================================
const KPI_ICONS: Record<string, LucideIcon> = {
    'Ganancias del Mes': DollarSign,
    'Pedidos en Curso': Package,
    'Oportunidades': FileText,
    'Calificación': Star,
};

// ============================================
// Suspense-wrapped sections
// ============================================

async function VendorKPIs() {
    const kpis = await getVendorKpisV2();

    if (kpis.length === 0) {
        return (
            <BentoGrid className="lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <BentoGridItem key={i}>
                        <StatCard label="Sin datos" value="--" icon={FileText} accent="indigo" />
                    </BentoGridItem>
                ))}
            </BentoGrid>
        );
    }

    return (
        <BentoGrid className="lg:grid-cols-4">
            {kpis.map((kpi) => (
                <BentoGridItem key={kpi.label}>
                    <StatCard
                        label={kpi.label}
                        value={kpi.value}
                        trend={kpi.trend}
                        trendLabel={kpi.trendLabel}
                        icon={KPI_ICONS[kpi.label] ?? FileText}
                        accent={kpi.accent}
                    />
                </BentoGridItem>
            ))}
        </BentoGrid>
    );
}

async function VendorOpportunitiesSection() {
    const opportunities = await getVendorOpportunities();

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Oportunidades Pendientes</h3>
                    <p className="text-sm text-muted-foreground">
                        {opportunities.length} cotizaciones esperando tu respuesta
                    </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/vendor/quotations">
                        Ver todo <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </div>

            {opportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No hay oportunidades disponibles por ahora.
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {opportunities.map((opp) => (
                        <div
                            key={opp.id}
                            className="flex items-center justify-between py-3 gap-3"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-muted-foreground">{opp.code}</span>
                                        {opp.isUrgent && (
                                            <Badge variant="warning" className="text-[10px] py-0">
                                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                                Urgente
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-foreground truncate">{opp.serviceName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{opp.brief}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {/* SLA Timer */}
                                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${opp.isUrgent
                                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    <Clock className="h-3 w-3" />
                                    <span>{opp.hoursRemaining}h restantes</span>
                                </div>

                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                    asChild
                                >
                                    <Link href={`/vendor/quotations/${opp.id}`}>
                                        Cotizar <ArrowRight className="ml-1 h-3 w-3" />
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

async function VendorActiveOrdersSection() {
    const orders = await getVendorActiveOrders();

    const STATUS_LABELS: Record<string, string> = {
        PENDING_ADMIN_APPROVAL: 'En Revisión',
        AWAITING_CLIENT_PAYMENT: 'Esperando Pago',
        APPROVED: 'Aprobada',
        PAID: 'Pagada',
    };

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Pedidos en Curso</h3>
                    <p className="text-sm text-muted-foreground">{orders.length} pedidos activos</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/vendor/orders">
                        Ver todo <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                    No tienes pedidos activos.
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between py-3 gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">{order.serviceName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-xs text-muted-foreground">{order.code}</span>
                                    <span className="text-xs text-muted-foreground">• {order.clientName}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-mono font-semibold tabular-nums text-foreground">
                                    {order.amount > 0 ? formatCLP(order.amount) : '--'}
                                </span>
                                <Badge variant={order.status === 'PAID' ? 'success' : 'info'}>
                                    {STATUS_LABELS[order.status] ?? order.status}
                                </Badge>
                                {order.eventDate && (
                                    <span className="text-xs text-muted-foreground hidden sm:inline">
                                        {formatDateShort(order.eventDate)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Onboarding Check (RSC) ─────────────────────────────────────
async function VendorOnboardingCheck() {
    const kpis = await getVendorKpisV2();
    const hasProfile = true; // If they can see this page, they have a profile
    const hasInventory = kpis.some(k => k.label === 'Pedidos en Curso' && k.numericValue > 0);
    const hasBids = kpis.some(k => k.label === 'Ganancias del Mes' && k.numericValue > 0) || hasInventory;
    return <VendorOnboarding hasProfile={hasProfile} hasInventory={hasInventory} hasBids={hasBids} />;
}

// ─── Performance Metrics (RSC) ──────────────────────────────────
async function VendorMetricsSection() {
    const data = await getVendorPerformanceMetrics();
    return <VendorPerformancePanel data={data} />;
}

// ============================================
// Main Page
// ============================================

export default function VendorDashboardPage() {
    return (
        <div className="space-y-6">
            <DashboardHeader
                name="Proveedor"
                subtitle="Gestiona tus oportunidades y maximiza tus ganancias."
                actions={
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all font-semibold rounded-lg" asChild>
                        <Link href="/vendor/quotations">
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Oportunidades
                        </Link>
                    </Button>
                }
            />

            {/* Onboarding (hidden when complete) */}
            <Suspense fallback={null}>
                <VendorOnboardingCheck />
            </Suspense>

            {/* Row 1: KPIs */}
            <Suspense fallback={<AnalyticsSkeleton />}>
                <VendorKPIs />
            </Suspense>

            {/* Row 2: Opportunities with SLA timers */}
            <Suspense fallback={<RecentAnalysesSkeleton />}>
                <VendorOpportunitiesSection />
            </Suspense>

            {/* Row 3: Active Orders */}
            <Suspense fallback={<RecentAnalysesSkeleton />}>
                <VendorActiveOrdersSection />
            </Suspense>

            {/* Row 4: Payment History + Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Suspense fallback={<RecentAnalysesSkeleton />}>
                    <VendorPaymentHistory />
                </Suspense>
                <Suspense fallback={<RecentAnalysesSkeleton />}>
                    <VendorFeedbackReceived />
                </Suspense>
            </div>

            {/* Row 5: Performance Metrics */}
            <Suspense fallback={<RecentAnalysesSkeleton />}>
                <VendorMetricsSection />
            </Suspense>
        </div>
    );
}
