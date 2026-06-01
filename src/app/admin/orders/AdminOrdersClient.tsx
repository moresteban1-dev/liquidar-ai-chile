'use client';

/**
 * AdminOrdersClient — Interactive client component for admin orders.
 * Receives pre-fetched orders from the RSC page via props.
 * Handles view switching (LIST / CALENDAR / GRID).
 */

import { formatCLP } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Package,
    DollarSign,
    TrendingUp,
    Calendar as CalendarIcon,
    LayoutGrid,
    Play,
    Send,
    Sparkles,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { LiquidCard } from '@/components/ui/liquid-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AvailabilityCalendar } from '@/components/admin/AvailabilityCalendar';
import { OrdersTable, OrderViewModel } from '@/components/admin/orders/OrdersTable';
import type { OrderData } from '@/actions/orders';
import { useSLARisks } from './hooks/useSLARisks';

interface AdminOrdersClientProps {
    orders: OrderData[];
}

export function AdminOrdersClient({ orders }: AdminOrdersClientProps) {
    const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR' | 'GRID'>('LIST');
    const { slaRisks, isAuditing } = useSLARisks();

    const stats = useMemo(() => {
        return {
            totalRevenue: orders.reduce((sum, o) => sum + o.priceTotal, 0),
            totalMargin: orders.reduce((sum, o) => sum + o.marginAmount, 0),
            count: orders.length
        };
    }, [orders]);

    const tableOrders = useMemo(() => {
        return orders.map(o => ({
            ...o,
            items: o.items.map(i => ({
                ...i,
                service: i.service ?? undefined,
            })),
            client: o.client ?? undefined,
            provider: o.provider ?? undefined,
            quotation: o.quotation ?? undefined,
            slaRisk: slaRisks[o.id]
        })) as OrderViewModel[];
    }, [orders, slaRisks]);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Órdenes y Planificación</h1>
                    <p className="text-muted-foreground text-lg mt-1">
                        Gestión centralizada de pedidos, producción y entregas.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    {isAuditing ? (
                        <Badge variant="outline" className="flex items-center gap-2 py-1.5 px-3 border-indigo-500/30 bg-indigo-500/5 text-indigo-500 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Escaneando riesgos SLA...
                        </Badge>
                    ) : (
                        Object.keys(slaRisks).length > 0 && (
                            <Badge variant="outline" className="flex items-center gap-2 py-1.5 px-3 border-emerald-500/30 bg-emerald-500/5 text-emerald-600">
                                <Sparkles className="h-3 w-3" />
                                Monitorizado por AI Guardian
                            </Badge>
                        )
                    )}
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard title="Total Órdenes" value={stats.count} icon={<Package className="h-4 w-4 text-indigo-500" />} />
                <KPICard title="Ingresos Totales" value={formatCLP(stats.totalRevenue)} icon={<DollarSign className="h-4 w-4 text-emerald-500" />} />
                <KPICard title="Margen Total" value={formatCLP(stats.totalMargin)} icon={<TrendingUp className="h-4 w-4 text-purple-500" />} />
            </div>

            {/* View Switching */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-lg w-fit border border-border/50">
                    <TabButton active={viewMode === 'LIST'} onClick={() => setViewMode('LIST')} icon={<Package className="h-4 w-4" />} label="Lista" />
                    <TabButton active={viewMode === 'CALENDAR'} onClick={() => setViewMode('CALENDAR')} icon={<CalendarIcon className="h-4 w-4" />} label="Calendario" />
                    <TabButton active={viewMode === 'GRID'} onClick={() => setViewMode('GRID')} icon={<LayoutGrid className="h-4 w-4" />} label="Tarjetas" />
                </div>

                {viewMode === 'CALENDAR' ? (
                    <Card className="border-border">
                        <CardContent className="p-6">
                            <AvailabilityCalendar />
                        </CardContent>
                    </Card>
                ) : viewMode === 'GRID' ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {orders.map((order) => (
                            <OrderGridItem key={order.id} order={order} />
                        ))}
                    </div>
                ) : (
                    <Card className="border-border shadow-sm overflow-hidden">
                        <OrdersTable data={tableOrders} />
                    </Card>
                )}
            </div>
        </div>
    );
}

/**
 * Sub-componentes Atómicos para mejorar Performance
 */
function KPICard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
    return (
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
            </CardContent>
        </Card>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
            }`}
        >
            {icon} {label}
        </button>
    );
}

function OrderGridItem({ order }: { order: OrderData }) {
    const isPaid = order.status === 'PAID';
    const isInternalReview = order.status === 'INTERNAL_REVIEW';
    const amount = formatCLP(order.priceTotal);

    return (
        <LiquidCard
            key={order.id}
            title={order.quotation?.code || 'Orden #' + order.code}
            className="h-full flex flex-col group"
            headerClassName="bg-muted/30 pb-3"
            action={<Badge variant="outline" className="text-[10px] font-bold">{order.status.replace(/_/g, ' ')}</Badge>}
        >
            <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-semibold text-foreground">{order.client?.name || 'Cliente'}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{order.client?.email}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-foreground text-sm">{amount}</div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground/80 line-clamp-2 italic">
                    {order.quotation?.brief || 'Sin detalles'}
                </p>

                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground">
                        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Pendiente'}
                    </span>
                    <div className="flex gap-1.5">
                        {isPaid && (
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]">
                                <Play className="h-3 w-3 mr-1" /> Producir
                            </Button>
                        )}
                        {isInternalReview && (
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]">
                                <Send className="h-3 w-3 mr-1" /> Entregar
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" asChild>
                            <Link href={`/admin/quotations/${order.id}`}>Ver</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </LiquidCard>
    );
}
