'use client';

import { QuotationDetail } from '@/app/admin/quotations/[id]/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCLP, formatProviderBidData } from '@/lib/quotation-fsm';
import { formatDate } from '@/lib/utils';
import { SkeletonLine } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Send, MapPin, Calendar, Clock, Info, CheckCircle2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const ProviderQuotationForm = dynamic(
    () => import('@/components/vendor/ProviderQuotationForm').then(mod => mod.ProviderQuotationForm),
    {
        ssr: false,
        loading: () => <SkeletonLine height="400px" />
    }
);

interface Props {
    id: string;
    quotation: QuotationDetail;
}

export function VendorQuotationDetailClient({ id, quotation }: Props) {
    const router = useRouter();
    const [providerItems, setProviderItems] = useState<any[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    useEffect(() => {
        if (quotation.status !== 'PENDING_PROVIDER_BID' && quotation.status !== 'PROVIDER_COTIZANDO') {
            setLoadingItems(true);
            fetch(`/api/quotations/${quotation.id}/provider-items`)
                .then(res => res.ok ? res.json() : [])
                .then(data => setProviderItems(data))
                .catch(() => toast.error('Error al cargar ítems cotizados'))
                .finally(() => setLoadingItems(false));
        }
    }, [quotation.id, quotation.status]);

    const handleSuccess = () => {
        toast.success('Propuesta enviada con éxito');
        router.refresh();
    };

    const isPending = quotation.status === 'PENDING_PROVIDER_BID' || quotation.status === 'PROVIDER_COTIZANDO';

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border px-8 py-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/vendor/quotations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                                <ArrowLeft className="h-4 w-4" /> Volver a Mis Cotizaciones
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Cotización {quotation.code}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Detalles del requerimiento y envío de propuesta.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={
                            quotation.publicStatus === 'RECIBIDA' ? 'secondary' : 
                            quotation.publicStatus === 'SENT_TO_CLIENT' ? 'info' : 'success'
                        } className="px-3 py-1 text-sm">
                            {quotation.publicStatus}
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="p-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Event Info Card */}
                        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" /> Información del Evento
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Servicio Solicitado</span>
                                    <p className="font-medium text-foreground">{quotation.service?.name || 'S/I'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Ubicación</span>
                                    <div className="flex items-center gap-1 text-foreground">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{quotation.eventLocation || 'No especificada'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Fecha Inicio</span>
                                    <div className="flex items-center gap-1 text-foreground">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{formatDate(quotation.eventStartDate)}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Horario</span>
                                    <div className="flex items-center gap-1 text-foreground">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{quotation.eventTime || 'No especificado'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Requerimientos / Brief</span>
                                <div className="mt-2 p-4 bg-muted/30 rounded-lg text-foreground/80 whitespace-pre-wrap text-sm border border-border/50">
                                    {quotation.brief}
                                </div>
                            </div>
                        </div>

                        {/* Bid Form or Summary */}
                        {isPending ? (
                            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
                                    <Send className="h-5 w-5 text-primary" /> Tu Propuesta Económica
                                </h2>
                                <ProviderQuotationForm 
                                    quotation={formatProviderBidData(quotation) as any} 
                                    onSuccess={handleSuccess}
                                />
                            </div>
                        ) : (
                            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg text-foreground">Propuesta Enviada</h2>
                                        <p className="text-xs text-muted-foreground">
                                            Tu propuesta está en revisión por el administrador.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 border-t border-border/60 pt-4">
                                    <h3 className="text-sm font-bold text-foreground/80 tracking-wide uppercase">Detalle del Presupuesto Enviado</h3>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    <th className="py-2 px-1">Categoría</th>
                                                    <th className="py-2 px-1">Concepto</th>
                                                    <th className="py-2 px-1 text-center">Cant.</th>
                                                    <th className="py-2 px-1 text-right">Costo Unit.</th>
                                                    <th className="py-2 px-1 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                                {loadingItems ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-6 text-center text-muted-foreground animate-pulse">Cargando desglose...</td>
                                                    </tr>
                                                ) : providerItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-6 text-center text-muted-foreground italic">Sin desglose disponible</td>
                                                    </tr>
                                                ) : (
                                                    providerItems.map((item) => {
                                                        const unitPrice = item.unitPriceNet ?? item.unit_price_net ?? 0;
                                                        const totalPrice = item.totalPriceNet ?? item.total_price_net ?? 0;
                                                        return (
                                                            <tr key={item.id} className="text-foreground/85 text-xs">
                                                                <td className="py-3 px-1 font-semibold text-[10px] tracking-wider text-muted-foreground uppercase">{item.category}</td>
                                                                <td className="py-3 px-1">{item.concept}</td>
                                                                <td className="py-3 px-1 text-center">{item.quantity}</td>
                                                                <td className="py-3 px-1 text-right">{formatCLP(unitPrice)}</td>
                                                                <td className="py-3 px-1 text-right font-semibold">{formatCLP(totalPrice)}</td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div className="bg-muted/40 p-4 rounded-xl border border-border/40 flex justify-between items-center font-bold text-sm mt-2">
                                        <span className="text-muted-foreground">COSTO TOTAL NETO COTIZADO:</span>
                                        <span className="text-foreground text-base tracking-tight">{formatCLP((quotation.subtotalServicesProvider || 0) + (quotation.subtotalLogisticsProvider || 0))}</span>
                                    </div>
                                    
                                    {quotation.providerNotes && (
                                        <div className="bg-muted/30 border border-border/30 rounded-xl p-4 mt-4">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Tus Comentarios / Notas</span>
                                            <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">{quotation.providerNotes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                            <h3 className="font-semibold mb-3">Estado de la Solicitud</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase mb-1">Tu Estado</div>
                                    <Badge variant={isPending ? 'warning' : 'success'} className="w-full justify-center py-1">
                                        {isPending ? 'PENDIENTE DE ENVÍO' : 'SENT_TO_CLIENT'}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase mb-1">Fecha de Solicitud</div>
                                    <div className="text-sm font-medium">{formatDate(quotation.createdAt)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" /> Ayuda
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Recuerda desglosar tus servicios y costos logísticos por separado. 
                                La plataforma agregará automáticamente el margen para el cliente final.
                            </p>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800">
                                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                                    Si necesitas realizar una visita técnica, actívalo en el formulario para que el administrador sea notificado.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
