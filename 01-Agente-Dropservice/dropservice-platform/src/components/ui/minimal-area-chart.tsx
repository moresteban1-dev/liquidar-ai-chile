"use client"

import { useTheme } from 'next-themes'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MinimalAreaChartProps {
    data: Record<string, string | number>[]
    title: string
    description?: string
    dataKey: string
    xAxisKey: string
    className?: string
    height?: number
    gradientColor?: string
}

export function MinimalAreaChart({
    data,
    title,
    description,
    dataKey,
    xAxisKey,
    className,
    height = 350,
    gradientColor = "hsl(var(--primary))" // Default to Primary/Indigo
}: MinimalAreaChartProps) {
    const { theme } = useTheme()
    const isDark = theme === "dark"

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                            <XAxis
                                dataKey={xAxisKey}
                                stroke={isDark ? "#94a3b8" : "#64748b"}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke={isDark ? "#94a3b8" : "#64748b"}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`} // Basic formatting, assumes currency
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                                    borderRadius: "12px",
                                    border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                labelStyle={{ color: isDark ? "#cbd5e1" : "#475569" }}
                                itemStyle={{ color: gradientColor }}
                            />
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={gradientColor}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#gradient-${dataKey})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
