import { fetchQuotationDetail } from '@/infrastructure/http/server-data/serverFetch';
import { UserRole } from '@/core/domain/auth/UserRole';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { VendorQuotationDetailClient } from './VendorQuotationDetailClient';
import { QuotationDetail } from '@/app/admin/quotations/[id]/types';

export default async function VendorQuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession();

    if (!session || session.role !== UserRole.VENDOR) {
        redirect('/login');
    }

    const rawQuotation = await fetchQuotationDetail(id);

    if (!rawQuotation) {
        notFound();
    }

    // Security check: ensure the quotation is assigned to this provider or is public/available
    if (rawQuotation.assigned_provider_id && rawQuotation.assigned_provider_id !== session.userId) {
        redirect('/vendor/quotations');
    }

    const quotation: QuotationDetail = {
        id: rawQuotation.id,
        code: rawQuotation.code,
        brief: rawQuotation.brief,
        requirements: rawQuotation.requirements,
        status: rawQuotation.status,
        publicStatus: rawQuotation.public_status || rawQuotation.status,
        priceCost: rawQuotation.price_cost,
        priceNet: rawQuotation.price_net,
        priceIva: rawQuotation.price_iva,
        priceTotal: rawQuotation.price_total,
        markupPercentage: rawQuotation.markup_percentage,
        markupAmount: rawQuotation.markup_amount,
        validUntil: rawQuotation.valid_until,
        createdAt: rawQuotation.created_at,
        eventStartDate: rawQuotation.event_start_date,
        eventEndDate: rawQuotation.event_end_date,
        eventLocation: rawQuotation.event_location,
        eventTime: rawQuotation.event_time,
        setupTime: rawQuotation.setup_time,
        teardownTime: rawQuotation.teardown_time,
        subtotalServicesProvider: rawQuotation.subtotal_services_provider || 0,
        subtotalLogisticsProvider: rawQuotation.subtotal_logistics_provider || 0,
        providerNotes: rawQuotation.provider_notes,
        providerSuggestsTechnicalVisit: rawQuotation.provider_suggests_technical_visit || false,
        client: null, 
        assignedProvider: null,
        service: rawQuotation.service ? {
            id: rawQuotation.service.id,
            name: rawQuotation.service.name,
            priceFrom: rawQuotation.service.price_from
        } : undefined,
    };

    return (
        <VendorQuotationDetailClient
            id={id}
            quotation={quotation}
        />
    );
}
