'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatCLP } from '@/lib/quotation-fsm';
import { LiquidCard } from '@/components/ui/liquid-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle,
    Clock,
    ClipboardList,
    DollarSign,
    ArrowLeft,
} from 'lucide-react';
import { ProviderQuotationForm } from '@/components/vendor/ProviderQuotationForm';
import { useVendorRealtime } from './hooks/useVendorRealtime';

interface VendorQuotationsClientProps {
    quotations: any[];
}

const STATUS_LABELS: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'neutral' }> = {
    PENDING_PROVIDER_BID: { label: 'Pendiente Cotización', variant: 'warning' },
    PENDING_ADMIN_APPROVAL: { label: 'En Revisión Admin', variant: 'info' },
    AWAITING_CLIENT_PAYMENT: { label: 'Enviada al Cliente', variant: 'info' },
    APPROVED: { label: 'Aprobada', variant: 'success' },
    PAID: { label: 'Pagada', variant: 'success' },
    FULFILLED: { label: 'Completada', variant: 'success' },
};

/**
 * VendorQuotationCard — Sub-component for individual cards to optimize reconciliation.
 */
function VendorQuotationCard({ quote, onQuote }: { quote: any; onQuote: (id: string) => void }) {
    const statusInfo = STATUS_LABELS[quote.status] || {
        label: quote.status,
        variant: 'neutral' as const,
    };
    const canQuote = quote.status === 'PENDING_PROVIDER_BID';
    const hasQuoted = ['PENDING_ADMIN_APPROVAL', 'AWAITING_CLIENT_PAYMENT', 'APPROVED', 'PAID', 'FULFILLED'].includes(quote.status);

    return (
        <LiquidCard
            title={quote.service?.name || 'Solicitud General'}
            className="h-full border-border/50 hover:border-border transition-colors group"
        >
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] text-muted-foreground/70 tracking-tighter">{quote.code}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(quote.createdAt).toLocaleDateString('es-CL')}</span>
                        </div>
                    </div>
                    <Badge variant={statusInfo.variant} className="px-2 py-0 text-[10px] font-bold">
                        {statusInfo.label}
                    </Badge>
                </div>

                <div className="bg-muted/40 p-4 rounded-xl border border-border/40 group-hover:bg-muted/60 transition-colors">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        Descripción
                    </h4>
                    <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">
                        {quote.brief}
                    </p>
                </div>

                {hasQuoted && quote.priceCost && (
                    <div className="flex items-center gap-3 text-xs bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Presupuesto: <strong className="text-sm">{formatCLP(quote.priceCost)}</strong></span>
                    </div>
                )}

                {canQuote ? (
                    <Button
                        onClick={() => onQuote(quote.id)}
                        className="w-full bg-foreground text-background hover:opacity-90 transition-opacity font-bold rounded-xl"
                    >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Cotizar Proyecto
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full rounded-xl text-xs font-semibold opacity-60" disabled>
                        En Proceso
                    </Button>
                )}
            </div>
        </LiquidCard>
    );
}

export function VendorQuotationsClient({ quotations = [] }: VendorQuotationsClientProps) {
    const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
    const router = useRouter();
    
    // Custom hook handles REALTIME safely
    useVendorRealtime();

    const activeQuote = useMemo(() => 
        activeQuoteId ? quotations.find((q) => q.id === activeQuoteId) : null
    , [activeQuoteId, quotations]);

    const handleBackToList = useCallback(() => setActiveQuoteId(null), []);
    
    const handleSuccess = useCallback(() => {
        setTimeout(() => {
            setActiveQuoteId(null);
            router.refresh();
        }, 1200);
    }, [router]);

    // --- Detailed Form View ---
    if (activeQuote) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={handleBackToList} className="hover:bg-accent/50">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                    </Button>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Cotizar <span className="text-primary/70">{activeQuote.code}</span>
                    </h1>
                </div>

                <div className="bg-card border rounded-2xl shadow-sm overflow-hidden p-1">
                    <ProviderQuotationForm
                        quotation={{
                            id: activeQuote.id,
                            code: activeQuote.code,
                            brief: activeQuote.brief,
                            eventStartDate: activeQuote.eventStartDate ?? undefined,
                            eventLocation: activeQuote.eventLocation ?? undefined,
                            eventAddress: activeQuote.eventAddress ?? undefined,
                            eventTime: activeQuote.eventTime ?? undefined,
                            setupTime: activeQuote.setupTime ?? undefined,
                            teardownTime: activeQuote.teardownTime ?? undefined,
                            eventEndTime: activeQuote.eventEndTime ?? undefined,
                            technicalVisit: activeQuote.technicalVisit,
                            clientName: activeQuote.clientName ?? undefined,
                        }}
                        onSuccess={handleSuccess}
                    />
                </div>
            </div>
        );
    }

    // --- List View ---
    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Oportunidades</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Proyectos exclusivos asignados a tu perfil comercial.
                    </p>
                </div>
                {quotations.length > 0 && <Badge variant="neutral" className="mb-1">{quotations.length} disponibles</Badge>}
            </div>

            {quotations.length === 0 ? (
                <div className="text-center py-20 rounded-3xl border-2 border-dashed border-border/50 bg-muted/20 backdrop-blur-sm">
                    <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h2 className="text-lg font-bold text-foreground mb-1">Tu bandeja está al día</h2>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Te notificaremos en tiempo real cuando un nuevo cliente solicite tus servicios.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                    {quotations.map((quote) => (
                        <VendorQuotationCard 
                            key={quote.id} 
                            quote={quote} 
                            onQuote={setActiveQuoteId} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
