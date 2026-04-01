'use client';

import { QuotationDetail } from '@/app/admin/quotations/[id]/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCLP, formatProviderBidData } from '@/lib/quotation-fsm';
import { formatDate } from '@/lib/utils';
import { SkeletonLine } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Send, MapPin, Calendar, Clock, Info } from 'lucide-react';
import dynamic from 'next/dynamic';

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

export function VendorQuotationDetailClient({ id: _id, quotation }: Props) {
    const router = useRouter();

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
                            <div className="bg-card rounded-xl p-6 shadow-sm border border-border opacity-90">
                                <h2 className="font-semibold text-lg mb-4">Propuesta Enviada</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Ya has enviado una propuesta para esta cotización. El administrador la está revisando.
                                </p>
                                <div className="bg-muted p-4 rounded-lg">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total Neto:</span>
                                        <span>{formatCLP((quotation.subtotalServicesProvider || 0) + (quotation.subtotalLogisticsProvider || 0))}</span>
                                    </div>
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
