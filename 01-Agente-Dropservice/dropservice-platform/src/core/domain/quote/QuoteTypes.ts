// Definición del dominio para Cotizaciones V2 (Inteligentes por Segmento)
// Basado en el "Master Informe Adaptado por Segmentos"

export type MarketSegment = 'CORPORATIVO' | 'AGENCIA' | 'SOCIAL_PREMIUM' | 'PUBLICO';

export type QuoteStatus = 'DRAFT' | 'GENERATED' | 'SENT' | 'ACCEPTED' | 'REJECTED';

export type QuoteOptionType = 'ECONOMICA' | 'RECOMENDADA' | 'PREMIUM';

export interface QuoteSessionClientData {
    name: string;
    email: string;
    phone: string;
    company?: string;
    preferences: string[];
}

export interface QuoteItemRequested {
    id?: string;
    sessionId?: string;
    catalogItemId?: string;
    isCustom: boolean;
    customName?: string;
}

export interface QuoteOption {
    id?: string;
    sessionId?: string;
    optionType: QuoteOptionType;
    totalValue: number;
    marginApplied: number;
    configNotes?: string;
    includedCatalogItems: string[]; // Array de catalog_item_id incluidos
}

export interface QuoteSession {
    id?: string;
    segment: MarketSegment;
    stepData: Record<string, unknown>; // Raw JSON from wizard para histórico o analítica
    eventType: string;
    options?: QuoteOption[]; // Commercial options generated
    requestedItems?: QuoteItemRequested[]; // Items requested by client
    eventDate?: Date | null;
    location: string;
    attendees: number;
    duration: string;
    budget: number;
    priorities: string[];
    isSustainable: boolean;
    needsPermits: string;
    clientData: QuoteSessionClientData;
    status: QuoteStatus;
    createdAt?: Date;
    updatedAt?: Date;
}
