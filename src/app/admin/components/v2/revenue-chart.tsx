/**
 * Revenue Chart — Server wrapper that fetches data and passes to client chart.
 * Separates data fetching (server) from interactivity (client).
 */
import { getAdminRevenueChart } from '@/lib/dashboard/admin-data.service';
import { RevenueChartClient } from './revenue-chart-client';

export async function RevenueChart() {
    const data = await getAdminRevenueChart();

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Ingresos y Margen</h3>
                <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
            </div>
            <RevenueChartClient data={data} />
        </div>
    );
}
