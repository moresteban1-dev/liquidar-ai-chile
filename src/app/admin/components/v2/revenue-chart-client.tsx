/**
 * Revenue Chart Client — Interactive recharts bar chart.
 * Client Component for tooltip/hover interactivity.
 */
'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import type { RevenueDataPoint } from '@/lib/dashboard/admin-data.service';

interface RevenueChartClientProps {
    data: RevenueDataPoint[];
}

function formatCompactCLP(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
}

export function RevenueChartClient({ data }: RevenueChartClientProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                No hay datos de ingresos disponibles.
            </div>
        );
    }

    return (
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.4}
                    />
                    <XAxis
                        dataKey="month"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatCompactCLP}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={55}
                    />
                    <Tooltip
                         
                        formatter={((value: number, name: string) => [
                            formatCompactCLP(value ?? 0),
                            name === 'revenue' ? 'Ingresos' : 'Margen',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ]) as any}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '13px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    />
                    <Legend
                        formatter={(value: string) =>
                            value === 'revenue' ? 'Ingresos' : 'Margen'
                        }
                        wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Bar
                        dataKey="revenue"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                    <Bar
                        dataKey="margin"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
