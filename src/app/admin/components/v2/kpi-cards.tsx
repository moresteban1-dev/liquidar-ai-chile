/**
 * KPI Cards V2 — Server Component with 4 rich KPIs fetched in parallel.
 * Consumes AdminDataService for real-time data.
 */
import { getAdminKpisV2 } from '@/lib/dashboard/admin-data.service';
import { StatCard } from '@/components/dashboard/stat-card';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import {
    DollarSign,
    TrendingUp,
    FileText,
    Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const KPI_ICONS: Record<string, LucideIcon> = {
    'Ingresos del Mes': DollarSign,
    'Margen Neto': TrendingUp,
    'Cotizaciones Activas': FileText,
    'Tasa de Conversión': Target,
};

export async function KpiCardsV2() {
    const kpis = await getAdminKpisV2();

    if (kpis.length === 0) {
        return (
            <BentoGrid className="lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <BentoGridItem key={i}>
                        <StatCard
                            label="Sin datos"
                            value="--"
                            icon={FileText}
                            accent="indigo"
                        />
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
