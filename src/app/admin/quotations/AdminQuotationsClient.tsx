'use client';

/**
 * AdminQuotationsClient — Interactive client component.
 * Receives pre-fetched quotations from RSC page via props.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { QuotationsTable, QuotationViewModel } from '@/components/admin/quotations/QuotationsTable';
// import type { QuotationListItem } from '@/actions/quotations';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

interface AdminQuotationsClientProps {
    quotations: any[]; // Using any temporarily for migration transition
}

export function AdminQuotationsClient({ quotations }: AdminQuotationsClientProps) {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel('admin-quotations-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'quotations' },
                (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => {
                    logger.info('Realtime Quotation Update Received (Admin):', payload);
                    // Refresh current RSC payload without losing browser state entirely
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    // Map QuotationListItem → QuotationsTable QuotationViewModel format
    const tableData: QuotationViewModel[] = quotations.map(q => ({
        id: q.id,
        code: q.code,
        brief: q.brief,
        publicStatus: q.publicStatus,
        status: q.status,
        priceCost: q.priceCost,
        priceTotal: q.priceTotal,
        created_at: q.createdAt,
        createdAt: q.createdAt,
        service: q.service || { name: 'Servicio General' },
        client: q.client || { name: 'Cliente Externo', email: '' },
        assignedProvider: q.assignedProvider || null,
        provider_bids: q.provider_bids || []
    }));

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Cotizaciones</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Gestión centralizada de solicitudes y presupuestos.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="neutral" className="px-3 py-1 text-base">
                        {quotations.length} total
                    </Badge>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <QuotationsTable data={tableData} />
            </div>
        </div>
    );
}
