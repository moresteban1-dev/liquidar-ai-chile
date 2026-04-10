'use client';

/**
 * VendorOrdersClient — Interactive component for vendor orders.
 * Receives pre-fetched orders from RSC page.
 * Handles markAsComplete action with router.refresh() for revalidation.
 */

import { formatCLP, formatDateReadable } from '@/lib/formatters';
import { LiquidCard } from '@/components/ui/liquid-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Check,
    Clock,
    CheckCircle,
    Package,
    Calendar,
    Play,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { VendorOrderItem } from '@/actions/quotations';

interface VendorOrdersClientProps {
    orders: VendorOrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; icon?: React.ElementType }> = {
    PAID: { label: 'Por Iniciar', variant: 'warning', icon: Clock },
    IN_PRODUCTION: { label: 'En Producción', variant: 'info', icon: Play },
    UNDER_REVIEW: { label: 'En Revisión (QA)', variant: 'warning', icon: Eye },
    DELIVERED: { label: 'Entregada', variant: 'success', icon: CheckCircle },
    COMPLETED: { label: 'Completada', variant: 'success', icon: CheckCircle },
};

export function VendorOrdersClient({ orders }: VendorOrdersClientProps) {
    const router = useRouter();

    const markAsComplete = async (orderId: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'UNDER_REVIEW' }),
            });
            if (response.ok) {
                toast.success('¡Trabajo entregado correctamente!');
                router.refresh();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Error al entregar');
            }
        } catch {
            toast.error('Error de conexión');
        }
    };

    const getDaysRemaining = (dateStr: string | null) => {
        if (!dateStr) return null;
        // eslint-disable-next-line react-hooks/purity
        return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Mis Trabajos</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Gestión de órdenes asignadas y entregas.
                </p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-24 rounded-2xl border border-dashed border-border bg-muted/30">
                    <Package className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">Sin trabajos asignados</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Cuando se te asigne un nuevo proyecto, aparecerá aquí para que puedas gestionarlo.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {orders.map((order) => {
                        const status = STATUS_CONFIG[order.status] || { label: order.status, variant: 'neutral' as const };
                        const daysRemaining = getDaysRemaining(order.deliveryDate);
                        const StatusIcon = status.icon;

                        return (
                            <LiquidCard
                                key={order.id}
                                title={order.quotation?.service?.name || 'Servicio'}
                                className="h-full flex flex-col"
                            >
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-xs text-muted-foreground">{order.code}</span>
                                            <Badge variant={status.variant} className="w-fit flex items-center gap-1.5 px-2.5 py-0.5">
                                                {StatusIcon && <StatusIcon className="h-3 w-3" />}
                                                {status.label}
                                            </Badge>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                                                {formatCLP(order.priceCost)}
                                            </div>
                                            <span className="text-xs text-muted-foreground">Tu pago</span>
                                        </div>
                                    </div>

                                    <div className="bg-muted/50 p-3 rounded-lg border border-border">
                                        <p className="text-sm text-foreground/80 line-clamp-3">
                                            {order.quotation?.brief || 'Sin descripción disponible.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>Entrega</span>
                                            </div>
                                            <span className="font-medium text-foreground pl-5.5">
                                                {formatDateReadable(order.deliveryDate)}
                                            </span>
                                        </div>

                                        {daysRemaining !== null && (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>Tiempo</span>
                                                </div>
                                                <span className={`font-bold pl-5.5 ${daysRemaining <= 2 ? 'text-red-500 dark:text-red-400' :
                                                    daysRemaining <= 5 ? 'text-amber-500 dark:text-amber-400' :
                                                        'text-emerald-500 dark:text-emerald-400'
                                                    }`}>
                                                    {daysRemaining > 0 ? `${daysRemaining} días` : 'Vencido'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        {(order.status === 'PAID' || order.status === 'IN_PRODUCTION' || order.status === 'UNDER_REVIEW') ? (
                                            <Button
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-md shadow-emerald-900/20"
                                                onClick={() => markAsComplete(order.id)}
                                            >
                                                <Check className="mr-2 h-4 w-4" /> Marcar como Entregado
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="w-full" disabled>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Estado: {status.label}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </LiquidCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
