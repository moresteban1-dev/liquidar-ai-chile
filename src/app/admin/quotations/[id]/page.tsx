import { fetchQuotationDetail, fetchQuotationHistory, fetchQuotationProviderItems } from '@/infrastructure/http/server-data/serverFetch';
import { notFound } from 'next/navigation';
import { AdminQuotationDetailClient } from './AdminQuotationDetailClient';
import { QuotationDetail, ProviderItemRow } from './types';

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [rawQuotation, rawHistory, rawProviderItems] = await Promise.all([
        fetchQuotationDetail(id),
        fetchQuotationHistory(id),
        fetchQuotationProviderItems(id)
    ]);

    if (!rawQuotation) {
        notFound();
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
        client: rawQuotation.client ? {
            id: rawQuotation.client.id,
            name: rawQuotation.client.full_name || rawQuotation.client.name,
            email: rawQuotation.client.email,
            phone: rawQuotation.client.phone
        } : null,
        assignedProvider: rawQuotation.assigned_provider ? {
            name: rawQuotation.assigned_provider.full_name || rawQuotation.assigned_provider.name
        } : null,
        service: rawQuotation.service ? {
            id: rawQuotation.service.id,
            name: rawQuotation.service.name,
            priceFrom: rawQuotation.service.price_from
        } : undefined,
        category: (rawQuotation.category || rawQuotation.service?.category) ? {
            name: rawQuotation.category?.name || rawQuotation.service?.category?.name
        } : undefined,
    };

    const providerItems: ProviderItemRow[] = rawProviderItems.map((pi: any) => ({
        id: pi.id,
        category: pi.category,
        concept: pi.concept,
        quantity: pi.quantity,
        unitPriceNet: pi.unit_price_net,
        totalPriceNet: pi.total_price_net,
    }));

    return (
        <AdminQuotationDetailClient
            id={id}
            quotation={quotation}
            providerItems={providerItems}
            history={rawHistory}
        />
    );
}
