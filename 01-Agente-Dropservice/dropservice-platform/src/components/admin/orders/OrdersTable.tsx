'use client';

import { ColumnDef } from '@tanstack/react-table';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Eye,
    Play,
    Send,
    Package,
    CheckCircle2,
    AlertCircle,
    Clock,
    DollarSign,
    ShieldCheck,
    AlertTriangle,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export interface OrderViewModel {
    id: string;
    code: string;
    status: string;
    priceCost: number;
    priceNet: number;
    priceTotal: number;
    marginAmount: number;
    marginPercentage: number;
    deliveryDate: string | null;
    client?: { name: string; email: string };
    provider?: { name: string } | null;
    quotation?: { code: string; brief: string };
    createdAt: string;
    slaRisk?: {
        level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        reason: string;
    };
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; icon?: React.ElementType }> = {
    PAID: { label: 'Pagada', variant: 'success', icon: DollarSign },
    IN_PRODUCTION: { label: 'En Producción', variant: 'warning', icon: Clock },
    UNDER_REVIEW: { label: 'En Revisión', variant: 'warning', icon: Eye },
    DELIVERED: { label: 'Entregada', variant: 'info', icon: Package },
    COMPLETED: { label: 'Completada', variant: 'success', icon: CheckCircle2 },
    REEMBOLSADA: { label: 'Reembolsada', variant: 'error', icon: AlertCircle },
};

export const columns: ColumnDef<OrderViewModel>[] = [
    {
        accessorKey: 'code',
        header: 'Código',
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-mono font-medium text-foreground">{row.original.code}</span>
                <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
            </div>
        ),
    },
    {
        id: 'slaRisk',
        header: 'Riesgo SLA',
        cell: ({ row }) => {
            const risk = row.original.slaRisk;
            if (!risk) return <div className="text-muted-foreground text-xs animate-pulse italic">Calculando...</div>;

            const config = {
                LOW: { color: 'text-green-600 bg-green-50 border-green-100', icon: ShieldCheck, label: 'Bajo' },
                MEDIUM: { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock, label: 'Medio' },
                HIGH: { color: 'text-orange-600 bg-orange-50 border-orange-100', icon: AlertTriangle, label: 'Alto' },
                CRITICAL: { color: 'text-rose-600 bg-rose-50 border-rose-100', icon: Zap, label: 'Crítico' },
            }[risk.level];

            const Icon = config.icon;

            return (
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium w-fit ${config.color}`} title={risk.reason}>
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                </div>
            );
        }
    },
    {
        accessorKey: 'client',
        header: 'Cliente',
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium text-foreground">{row.original.client?.name}</span>
                <span className="text-xs text-muted-foreground">{row.original.client?.email}</span>
            </div>
        ),
    },
    {
        accessorKey: 'provider',
        header: 'Proveedor',
        cell: ({ row }) => (
            <div className="flex items-center">
                {row.original.provider ? (
                    <span className="text-foreground/80">{row.original.provider.name}</span>
                ) : (
                    <span className="text-muted-foreground italic">Sin asignar</span>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
            const status = STATUS_CONFIG[row.original.status] || { label: row.original.status, variant: 'neutral' };
            const Icon = status.icon;
            return (
                <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                    {Icon && <Icon className="h-3 w-3" />}
                    {status.label}
                </Badge>
            );
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'priceTotal',
        header: () => (
            <div className="text-right">Total</div>
        ),
        cell: ({ row }) => {
            const amount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(row.original.priceTotal);
            return <div className="text-right font-medium text-foreground">{amount}</div>;
        },
    },
    {
        accessorKey: 'marginAmount',
        header: () => (
            <div className="text-right">Margen</div>
        ),
        cell: ({ row }) => {
            const amount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(row.original.marginAmount);
            return (
                <div className="text-right">
                    <span className="font-medium text-emerald-600 dark:text-emerald-500">{amount}</span>
                    <span className="text-xs text-muted-foreground block">({row.original.marginPercentage.toFixed(0)}%)</span>
                </div>
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const order = row.original;

            const handleStatusChange = async (newStatus: string) => {
                try {
                    const response = await fetch(`/api/orders/${order.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus }),
                    });
                    if (response.ok) {
                        toast.success('Estado actualizado correctamente');
                        window.location.reload();
                    } else {
                        toast.error('Error al actualizar estado');
                    }
                } catch {
                    toast.error('Error de conexión');
                }
            };

            return (
                <div className="flex justify-end gap-2">
                    {order.status === 'PAID' && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange('IN_PRODUCTION')} title="Iniciar Producción">
                            <Play className="h-4 w-4 text-emerald-600" />
                        </Button>
                    )}
                    {order.status === 'UNDER_REVIEW' && (
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange('DELIVERED')} title="Entregar al Cliente">
                            <Send className="h-4 w-4 text-blue-600" />
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" asChild>
                        <Link href={`/admin/quotations/${order.id}`}>
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-indigo-600 transition-colors" />
                        </Link>
                    </Button>
                </div>
            );
        },
    },
];

export function OrdersTable({ data }: { data: OrderViewModel[] }) {
    return (
        <AdvancedDataTable
            columns={columns}
            data={data}
            filterColumn="client" // Search by client name
            filterPlaceholder="Buscar cliente..."
            facetedFilters={[
                {
                    column: 'status',
                    title: 'Estado',
                    options: Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                        label: config.label,
                        value: key,
                    })),
                },
            ]}
        />
    );
}
