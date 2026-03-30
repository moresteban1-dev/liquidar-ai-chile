// ============================================================
// Admin Payment Management Panel — RSC Component
// Displays all platform payments with status, gateway, and amount
// ============================================================

import { getAdminPaymentsList } from '@/lib/dashboard/admin-data.service';
import { formatCLP } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    CreditCard, CheckCircle, AlertCircle, Clock,
    ArrowUpRight, Receipt, DollarSign,
} from 'lucide-react';
import Link from 'next/link';

const GATEWAY_LABELS: Record<string, { label: string; color: string }> = {
    webpay: { label: 'Webpay', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400' },
    manual_transfer: { label: 'Transferencia', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' },
    khipu: { label: 'Khipu', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' },
    flow: { label: 'Flow', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400' },
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    approved: { icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400', label: 'Aprobado' },
    pending: { icon: <Clock className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400', label: 'Pendiente' },
    processing: { icon: <Clock className="h-3.5 w-3.5 animate-spin" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400', label: 'Procesando' },
    rejected: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400', label: 'Rechazado' },
    pending_review: { icon: <Receipt className="h-3.5 w-3.5" />, color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400', label: 'Por Revisar' },
    cancelled: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', label: 'Cancelado' },
    refunded: { icon: <ArrowUpRight className="h-3.5 w-3.5" />, color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400', label: 'Reembolsado' },
    expired: { icon: <Clock className="h-3.5 w-3.5" />, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500', label: 'Expirado' },
};

export async function AdminPaymentsPanel() {
    const payments = await getAdminPaymentsList();

    const totalApproved = payments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + p.amount, 0);
    const pendingReview = payments.filter(p => p.status === 'pending_review').length;
    const totalCount = payments.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-indigo-500" />
                    Gestión de Pagos
                </h2>
                <p className="text-muted-foreground mt-1">
                    Todos los pagos de la plataforma • {totalCount} transacciones
                </p>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/50 border-border">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Cobrado</p>
                            <p className="text-xl font-bold text-foreground">{formatCLP(totalApproved)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pendientes de Revisión</p>
                            <p className="text-xl font-bold text-foreground">{pendingReview}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Transacciones</p>
                            <p className="text-xl font-bold text-foreground">{totalCount}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payments Table */}
            <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-foreground">Historial de Pagos</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Últimas {totalCount} transacciones procesadas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto rounded-lg">
                        <table className="w-full text-sm text-left text-muted-foreground">
                            <thead className="text-xs text-foreground/80 uppercase bg-muted/50">
                                <tr>
                                    <th scope="col" className="px-4 py-3">ID</th>
                                    <th scope="col" className="px-4 py-3">Cliente</th>
                                    <th scope="col" className="px-4 py-3">Pasarela</th>
                                    <th scope="col" className="px-4 py-3">Monto</th>
                                    <th scope="col" className="px-4 py-3">Estado</th>
                                    <th scope="col" className="px-4 py-3">Fecha</th>
                                    <th scope="col" className="px-4 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {payments.map((payment) => {
                                    const gateway = GATEWAY_LABELS[payment.gatewaySlug] || { label: payment.gatewaySlug, color: 'bg-muted text-muted-foreground' };
                                    const statusInfo = STATUS_CONFIG[payment.status] || STATUS_CONFIG['pending']!;

                                    return (
                                        <tr key={payment.id} className="bg-transparent hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-4 font-mono text-xs font-medium text-foreground whitespace-nowrap">
                                                {payment.id.substring(0, 8)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="font-medium text-foreground text-sm">{payment.clientName}</p>
                                                    <p className="text-xs text-muted-foreground">{payment.clientEmail}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant="outline" className={gateway.color}>
                                                    {gateway.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 font-semibold text-foreground">
                                                {formatCLP(payment.amount)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant="outline" className={`${statusInfo.color} flex items-center gap-1 w-fit`}>
                                                    {statusInfo.icon}
                                                    {statusInfo.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                                {new Date(payment.createdAt).toLocaleDateString('es-CL', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/admin/orders`}
                                                        className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
                                                    >
                                                        Ver orden
                                                    </Link>
                                                    {payment.receiptUrl && (
                                                        <a
                                                            href={payment.receiptUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs"
                                                        >
                                                            Comprobante
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {payments.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                                            <p className="text-muted-foreground">No hay pagos registrados</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
