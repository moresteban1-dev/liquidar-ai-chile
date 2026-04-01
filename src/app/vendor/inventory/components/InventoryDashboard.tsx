'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, CheckCircle, DollarSign, BarChart3 } from 'lucide-react';
import { InventoryStats } from '@core/domain/provider/ProviderInventoryTypes';

interface Props {
    stats: InventoryStats;
}

export default function InventoryDashboard({ stats }: Props) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

    const cards = [
        {
            title: 'Total Ítems',
            value: stats.totalItems,
            icon: <Package className="w-5 h-5 text-blue-500" />,
            description: 'En tu colección'
        },
        {
            title: 'Disponibles',
            value: stats.availableItems,
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            description: 'Activos para matching'
        },
        {
            title: 'Valor Total',
            value: formatCurrency(stats.totalValue),
            icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
            description: 'Estimado'
        },
        {
            title: 'Costo Promedio',
            value: formatCurrency(stats.averageCost),
            icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
            description: 'Por unidad'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                            <div className="p-2 bg-muted rounded-lg">
                                {card.icon}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold">{card.value}</span>
                            <span className="text-xs text-muted-foreground mt-1">{card.description}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
