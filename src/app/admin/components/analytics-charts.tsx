'use client';

import { formatCLP } from '@/lib/formatters';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { AnalyticsServerData } from '@/lib/dashboard/admin-data.service';

const CHART_COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#64748b',
];

export function RevenueBarChart({ data }: { data: AnalyticsServerData['charts']['revenue'] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8" dy={10} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8"
                    tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #1e293b',
                        borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)', color: '#f1f5f9',
                    }}
                    formatter={(value: any) => [formatCLP(Number(value) || 0), 'Ingresos']}
                    labelStyle={{ color: '#cbd5e1', marginBottom: '0.25rem' }}
                />
                <Bar dataKey="revenue" fill="url(#indigoGradient)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <defs>
                    <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                    </linearGradient>
                </defs>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function StatusPieChart({ data }: { data: AnalyticsServerData['charts']['status'] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={80} outerRadius={100}
                    paddingAngle={5} dataKey="value">
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #1e293b',
                        borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)', color: '#f1f5f9',
                    }}
                    itemStyle={{ color: '#f1f5f9', fontWeight: 500 }}
                />
                <Legend
                    verticalAlign="bottom" height={36} iconType="circle"
                    formatter={(value) => <span className="text-muted-foreground text-sm ml-1">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
