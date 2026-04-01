export interface ProviderItemRow {
    id: string;
    category: 'SERVICIO' | 'LOGISTICA';
    concept: string;
    quantity: number;
    unitPriceNet: number;
    totalPriceNet: number;
}

export interface QuotationDetail {
    id: string;
    code: string;
    brief: string;
    requirements: string | null;
    publicStatus: string;
    status: string;
    priceCost: number | null | undefined;
    priceNet: number | null | undefined;
    priceIva: number | null | undefined;
    priceTotal: number | null | undefined;
    markupPercentage: number | null | undefined;
    markupAmount: number | null | undefined;
    validUntil: string | null | undefined;
    createdAt: string;
    eventStartDate?: string | null | undefined;
    eventEndDate?: string | null | undefined;
    eventLocation?: string | null | undefined;
    eventTime?: string | null | undefined;
    setupTime?: string | null | undefined;
    teardownTime?: string | null | undefined;
    subtotalServicesProvider: number;
    subtotalLogisticsProvider: number;
    providerNotes?: string | null | undefined;
    providerSuggestsTechnicalVisit: boolean;
    client: {
        id: string;
        name: string;
        email: string;
        phone: string | null | undefined;
    } | null | undefined;
    assignedProvider: {
        name: string;
    } | null | undefined;
    service?: { id: string; name: string; priceFrom: number } | undefined;
    category?: { name: string } | undefined;
}
