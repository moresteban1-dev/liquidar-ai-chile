'use client';

/**
 * ClientOrdersClient — Interactive component for client orders.
 * Receives pre-fetched orders from the RSC page.
 * Handles approve/revision actions and order display.
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import Link from 'next/link';
import { formatCLP, formatDateReadable } from '@/lib/formatters';
import { LiquidCard } from '@/components/ui/liquid-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    Package,
    CreditCard,
    Settings,
    Truck,
    RefreshCw,
    ShoppingCart,
    Check,
    Calendar,
    FileText,
    Clock,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { OrderData } from '@/actions/orders';

interface ClientOrdersClientProps {
    orders: OrderData[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; icon: React.ElementType }> = {
    DRAFT:           { label: 'Borrador', variant: 'neutral', icon: FileText },
    PENDING_PAYMENT: { label: 'Pendiente de Pago', variant: 'warning', icon: Clock },
    PAID:            { label: 'Pagada', variant: 'success', icon: CreditCard },
    IN_PRODUCTION:   { label: 'En Producción', variant: 'info', icon: Settings },
    UNDER_REVIEW:    { label: 'En Revisión', variant: 'info', icon: Eye },
    DELIVERED:       { label: 'Entregada', variant: 'info', icon: Truck },
    COMPLETED:       { label: 'Completada', variant: 'success', icon: CheckCircle2 },
    REEMBOLSADA:     { label: 'Reembolsada', variant: 'error', icon: RefreshCw },
};

const PROGRESS_MAP: Record<string, number> = {
    DRAFT: 0,
    PENDING_PAYMENT: 10,
    PAID: 20,
    IN_PRODUCTION: 40,
    UNDER_REVIEW: 60,
    DELIVERED: 80,
    COMPLETED: 100,
    REEMBOLSADA: 0,
};

export function ClientOrdersClient({ orders }: ClientOrdersClientProps) {
    const router = useRouter();

    const handleAction = async (orderId: string, action: 'approve' | 'revision') => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: action === 'approve' ? 'COMPLETED' : 'UNDER_REVIEW',
                }),
            });
            if (response.ok) {
                toast.success(action === 'approve'
                    ? '¡Trabajo aprobado! Gracias por confiar en nosotros.'
                    : 'Solicitud de cambios enviada. Te contactaremos pronto.',
                );
                router.refresh(); // Revalidate RSC data
            } else {
                const data = await response.json();
                toast.error(data.error || 'Error');
            }
        } catch (error) {
            logger.error('Error in connection:', error);
            toast.error('Error de conexión');
        }
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Mis Pedidos</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Seguimiento de tus proyectos</p>
                </div>
                <div className="flex gap-4">
                    <Button asChild variant="outline" className="hidden sm:flex">
                        <Link href="/client/quotations">Ver Cotizaciones</Link>
                    </Button>
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                        <Link href="/client/quotations/request">Nueva Cotización</Link>
                    </Button>
                </div>
            </div>

            {/* Orders Grid */}
            {orders.length === 0 ? (
                <div className="text-center py-24 rounded-2xl border border-dashed border-border bg-muted/30">
                    <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">No tienes pedidos activos</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Cuando apruebes una cotización, tu pedido aparecerá aquí para que puedas seguir su progreso.
                    </p>
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/client/quotations">Ver mis Cotizaciones</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {orders.map((order) => {
                        const status = STATUS_CONFIG[order.status] || {
                            label: order.status,
                            variant: 'neutral' as const,
                            icon: Package,
                        };
                        const progress = PROGRESS_MAP[order.status] || 20;
                        const StatusIcon = status.icon;

                        return (
                            <LiquidCard
                                key={order.id}
                                title={order.quotation?.brief?.slice(0, 40) || 'Servicio Personalizado'}
                                className="h-full flex flex-col group"
                                headerClassName="bg-muted/30 pb-3"
                                action={
                                    <Badge variant={status.variant} className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs">
                                        <StatusIcon className="h-3 w-3" />
                                        {status.label}
                                    </Badge>
                                }
                            >
                                <div className="space-y-4 flex-1 flex flex-col">
                                    {/* Order Code & Date */}
                                    <div className="flex justify-between items-center text-xs text-muted-foreground font-mono border-b border-border pb-2">
                                        <span>{order.code}</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDateReadable(order.createdAt)}
                                        </span>
                                    </div>

                                    {/* Brief Description */}
                                    <div className="flex-1">
                                        <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">
                                            {order.quotation?.brief || 'Sin descripción disponible.'}
                                        </p>
                                    </div>

                                    {/* Delivery Info */}
                                    <div className="bg-muted/50 p-2.5 rounded-lg border border-border flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                                            <Truck className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Entrega Estimada</span>
                                            <span className="text-sm font-medium text-foreground">{formatDateReadable(order.deliveryDate)}</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Progreso</span>
                                            <span className="font-medium text-foreground">{progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out rounded-full ${order.status === 'COMPLETED' ? 'bg-emerald-500' :
                                                    order.status === 'DELIVERED' ? 'bg-indigo-500' :
                                                        order.status === 'UNDER_REVIEW' ? 'bg-amber-500' :
                                                            'bg-blue-500'
                                                    }`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer Actions & Price */}
                                    <div className="pt-2 mt-auto border-t border-border flex items-center justify-between gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total</span>
                                            <span className="text-lg font-bold text-foreground">{formatCLP(order.priceTotal)}</span>
                                        </div>

                                        {order.status === 'DELIVERED' ? (
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                onClick={() => handleAction(order.id, 'approve')}
                                            >
                                                <Check className="mr-1.5 h-3.5 w-3.5" /> Aprobar
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="sm" asChild className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 -mr-2">
                                                <Link href={`/client/orders/${order.id}`}>
                                                    Ver Detalle
                                                </Link>
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
