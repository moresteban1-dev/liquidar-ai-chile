'use client';

import { QuotationDetail, ProviderItemRow } from './types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DownloadQuoteButton } from '@/components/quotations/DownloadQuoteButton';
import { formatDate, parseRequirements } from '@/lib/utils';
import { formatCLP } from '@/lib/quotation-fsm';
import dynamic from 'next/dynamic';
import { SkeletonLine } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { ProviderMatchingPanel } from '@/components/admin/quotations/ProviderMatchingPanel';
import { NegotiationChatbot } from '@/components/features/ai/NegotiationChatbot';
import { PricingSummary } from '@/app/admin/components/v2/pricing-summary';
import { QuotationHistoryTimeline } from '@/components/admin/quotations/QuotationHistoryTimeline';
import { UserRole } from '@/core/domain/auth/UserRole';

const AdminQuotationReview = dynamic(
    () => import('@/components/admin/quotations/AdminQuotationReview').then(mod => mod.AdminQuotationReview),
    {
        ssr: false,
        loading: () => (
            <div className="space-y-4">
                <SkeletonLine height="200px" />
                <SkeletonLine height="400px" />
            </div>
        )
    }
);

interface Props {
    id: string;
    quotation: QuotationDetail;
    providerItems: ProviderItemRow[];
    history: any[];
}

export function AdminQuotationDetailClient({ id, quotation, providerItems, history }: Props) {
    const router = useRouter();

    async function handleReturnToProvider() {
        try {
            const response = await fetch(`/api/quotations/${id}/transition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toStatus: 'PENDING_PROVIDER_BID' }),
            });
            if (!response.ok) throw new Error('Error devolviendo');
            toast.success('Devuelta al proveedor');
            router.refresh();
        } catch {
            toast.error('Error devolviendo al proveedor');
        }
    }

    // REVIEW MODE: If PENDING_ADMIN_APPROVAL, show ReviewPanel
    if (quotation.status === 'PENDING_ADMIN_APPROVAL' && providerItems.length > 0) {
        return (
            <div className="space-y-6 p-8 max-w-5xl mx-auto">
                <Button variant="ghost" onClick={() => router.push('/admin/quotations')}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Volver a Cotizaciones
                </Button>

                <AdminQuotationReview
                    quotation={{
                        id: quotation.id,
                        code: quotation.code,
                        brief: quotation.brief,
                        status: quotation.status,
                        clientName: quotation.client?.name ?? 'Cliente Desconocido',
                        providerName: quotation.assignedProvider?.name ?? 'No asignado',
                        eventStartDate: quotation.eventStartDate ?? undefined,
                        eventLocation: quotation.eventLocation ?? undefined,
                        providerNotes: quotation.providerNotes ?? undefined,
                        subtotalServicesProvider: quotation.subtotalServicesProvider,
                        subtotalLogisticsProvider: quotation.subtotalLogisticsProvider,
                        providerItems: providerItems.map((pi) => ({
                            id: pi.id,
                            category: pi.category,
                            concept: pi.concept,
                            quantity: pi.quantity,
                            unitPriceNet: pi.unitPriceNet,
                            totalPriceNet: pi.totalPriceNet,
                        })),
                    }}
                    onSuccess={() => router.push('/admin/quotations')}
                    onReturn={handleReturnToProvider}
                />

                <div className="mt-8">
                    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                        <QuotationHistoryTimeline history={history} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border px-8 py-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/admin/quotations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                                ← Volver a Cotizaciones
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Cotización {quotation.code}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Detalles de la solicitud y gestión de proveedores.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {quotation.status === 'PENDING_ADMIN_APPROVAL' && quotation.providerSuggestsTechnicalVisit && (
                            <Badge variant="warning" className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 border-yellow-300">
                                📍 Visita Técnica Sugerida
                            </Badge>
                        )}
                        <Badge variant={
                            quotation.publicStatus === 'COTIZADA' ? 'success' :
                                quotation.publicStatus === 'RECIBIDA' ? 'neutral' : 'info'
                        } className="px-3 py-1 text-sm">
                            {quotation.publicStatus}
                        </Badge>
                        <DownloadQuoteButton
                            quotation={quotation as any}
                            clientItems={[]}
                            label="PDF Cliente"
                        />
                        {quotation.assignedProvider && (
                            <DownloadQuoteButton
                                quotation={quotation as any}
                                format="PROVIDER"
                                label="PDF Proveedor"
                            />
                        )}
                    </div>
                </div>
            </header>

            <main className="p-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div id="admin-quotation-printable" className="lg:col-span-2 space-y-6">
                        {/* Event Logistics */}
                        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                📍 Logística del Evento
                            </h2>
                            {(!quotation.eventStartDate && !quotation.eventLocation) ? (
                                <div className="p-4 bg-muted text-muted-foreground text-sm rounded-lg italic text-center">
                                    No se ha especificado información logística.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                                    {quotation.eventLocation && (
                                        <div className="md:col-span-2 p-3 bg-muted rounded-lg">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ubicación</div>
                                            <div className="font-medium text-foreground">{quotation.eventLocation}</div>
                                        </div>
                                    )}
                                    <div className="p-3 bg-muted rounded-lg">
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fecha Inicio</div>
                                        <div className="font-medium text-foreground">{formatDate(quotation.eventStartDate)}</div>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fecha Término</div>
                                        <div className="font-medium text-foreground">{formatDate(quotation.eventEndDate)}</div>
                                    </div>
                                    {quotation.eventTime && (
                                        <div className="p-3 bg-muted rounded-lg">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Hora Servicio</div>
                                            <div className="font-medium text-foreground">{quotation.eventTime}</div>
                                        </div>
                                    )}
                                    {quotation.setupTime && (
                                        <div className="p-3 bg-muted rounded-lg">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Horario Montaje</div>
                                            <div className="font-medium text-foreground">{quotation.setupTime}</div>
                                        </div>
                                    )}
                                    {quotation.teardownTime && (
                                        <div className="p-3 bg-muted rounded-lg">
                                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Horario Desmontaje</div>
                                            <div className="font-medium text-foreground">{quotation.teardownTime}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Client Info */}
                        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                            <h2 className="font-semibold text-foreground mb-4">Información del Cliente</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Nombre</div>
                                    <div className="font-medium">{quotation.client?.name || 'No disponible'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Email</div>
                                    <div className="font-medium">{quotation.client?.email || 'No disponible'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Teléfono</div>
                                    <div className="font-medium">{quotation.client?.phone || '-'}</div>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="text-sm text-muted-foreground">Brief</div>
                                <div className="mt-1 p-3 bg-muted rounded-lg text-foreground/80">
                                    {(() => {
                                        const { text, tags } = parseRequirements(quotation.brief);
                                        return (
                                            <>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {tags.map((tag: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="whitespace-pre-wrap">{text}</p>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Pricing Summary (for sent/approved quotations) */}
                        {quotation.priceTotal && (
                            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                <h2 className="font-semibold text-foreground mb-4">💰 Resumen Financiero</h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Costo Proveedor:</span>
                                        <span className="font-medium">{formatCLP(quotation.priceCost)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Comisión:</span>
                                        <span className="font-medium">{formatCLP(quotation.markupAmount)}</span>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal NETO:</span>
                                        <span className="font-medium">{formatCLP(quotation.priceNet)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">IVA 19%:</span>
                                        <span className="font-medium">{formatCLP(quotation.priceIva)}</span>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total:</span>
                                        <span className="text-primary">{formatCLP(quotation.priceTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                            <h2 className="font-semibold text-foreground mb-4">Acciones Rápidas</h2>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/admin/quotations')}
                                    className="w-full"
                                >
                                    Volver a la Lista
                                </Button>
                            </div>
                        </div>

                        {/* Provider Matching Panel */}
                        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                            <ProviderMatchingPanel quotationId={quotation.id} />
                        </div>

                        {/* Agentic Hub: Negotiator */}
                        {(quotation.status === 'PENDING_ADMIN_APPROVAL' || quotation.status === 'PENDING_PROVIDER_BID' || quotation.status === 'PROVIDER_COTIZANDO') && (
                            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                                <NegotiationChatbot quotationId={quotation.id} role={UserRole.ADMIN} />
                            </div>
                        )}

                        {/* Pricing Breakdown — only when pricing data exists */}
                        {quotation.priceTotal && quotation.priceTotal > 0 && (
                            <PricingSummary
                                providerTotal={(quotation.subtotalServicesProvider || 0) + (quotation.subtotalLogisticsProvider || 0)}
                                commissionTotal={quotation.markupAmount || 0}
                                commissionMethod={null}
                                totalNet={quotation.priceNet || 0}
                                totalIva={quotation.priceIva || 0}
                                totalWithIva={quotation.priceTotal || 0}
                                subtotalServices={quotation.subtotalServicesProvider || 0}
                                subtotalLogistics={quotation.subtotalLogisticsProvider || 0}
                            />
                        )}

                        {/* Quotation History Timeline */}
                        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                            <QuotationHistoryTimeline history={history} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
