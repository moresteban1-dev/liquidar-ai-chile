/**
 * Client KPIs V2 — Server Component with 4 KPI cards.
 */
import { getClientKpisV2 } from '@/lib/dashboard/client-data.service';
import { StatCard } from '@/components/dashboard/stat-card';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import {
    FileText,
    CheckCircle2,
    DollarSign,
    Calendar,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const KPI_ICONS: Record<string, LucideIcon> = {
    'Cotizaciones Activas': FileText,
    'Pedidos Confirmados': CheckCircle2,
    'Total Invertido': DollarSign,
    'Próximos Eventos': Calendar,
};

interface ClientKpisV2Props {
    userId: string;
}

export async function ClientKpisV2({ userId }: ClientKpisV2Props) {
    const kpis = await getClientKpisV2(userId);

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
