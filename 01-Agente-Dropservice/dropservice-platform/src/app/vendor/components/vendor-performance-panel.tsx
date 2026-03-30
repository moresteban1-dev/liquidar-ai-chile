'use client';

import { formatCLP } from '@/lib/formatters';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Star, CheckCircle, BarChart2 } from 'lucide-react';
import type { VendorPerformanceData } from '@/lib/dashboard/vendor-data.service';

export function VendorPerformancePanel({ data }: { data: VendorPerformanceData }) {
    return (
        <div className="space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card/50 border-border">
                    <CardContent className="pt-5 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Conversión</p>
                            <p className="text-lg font-bold text-foreground">{data.conversionRate}%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                    <CardContent className="pt-5 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Completadas</p>
                            <p className="text-lg font-bold text-foreground">{data.totalCompleted}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                    <CardContent className="pt-5 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
                            <BarChart2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Asignadas</p>
                            <p className="text-lg font-bold text-foreground">{data.totalAssigned}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                    <CardContent className="pt-5 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                            <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Rating</p>
                            <p className="text-lg font-bold text-foreground">{data.averageRating}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Earnings Chart */}
            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-foreground text-lg">Ganancias Mensuales</CardTitle>
                    <CardDescription className="text-muted-foreground">Últimos 6 meses de ingresos</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px] pl-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.earningsByMonth} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8" />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#94a3b8"
                                tickFormatter={(v) => `$${v / 1000}k`} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #1e293b',
                                    borderRadius: '0.5rem', color: '#f1f5f9',
                                }}
                                formatter={(value: any) => [formatCLP(Number(value) || 0), 'Ganancia']}
                            />
                            <Bar dataKey="earnings" fill="url(#emeraldGradient)" radius={[4, 4, 0, 0]} maxBarSize={45} />
                            <defs>
                                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
