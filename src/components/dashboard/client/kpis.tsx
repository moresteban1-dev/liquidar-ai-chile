import { getCachedClientKPIs } from '@/actions/dashboard';
import { StatCard } from '@/components/dashboard/stat-card';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { FileText, ShoppingCart, DollarSign } from 'lucide-react';
import { formatCLP } from '@/lib/formatters';

export async function ClientKPIs({ userId }: { userId: string }) {
    const kpis = await getCachedClientKPIs(userId);

    return (
        <BentoGrid className="lg:grid-cols-3">
            <BentoGridItem>
                <StatCard
                    label="Mis Cotizaciones"
                    value={String(kpis.activeQuotes.value)}
                    trend={kpis.activeQuotes.trend}
                    trendLabel="activas"
                    icon={FileText}
                    accent="indigo"
                    sparklineData={kpis.activeQuotes.spark}
                />
            </BentoGridItem>
            <BentoGridItem>
                <StatCard
                    label="Pedidos Activos"
                    value={String(kpis.activeOrders.value)}
                    trend={kpis.activeOrders.trend}
                    trendLabel="en proceso"
                    icon={ShoppingCart}
                    accent="blue"
                    sparklineData={kpis.activeOrders.spark}
                />
            </BentoGridItem>
            <BentoGridItem>
                <StatCard
                    label="Gasto Total"
                    value={formatCLP(Number(kpis.totalSpent.value))}
                    trend={kpis.totalSpent.trend}
                    trendLabel="este mes"
                    icon={DollarSign}
                    accent="emerald"
                    sparklineData={kpis.totalSpent.spark}
                />
            </BentoGridItem>
        </BentoGrid>
    );
}
