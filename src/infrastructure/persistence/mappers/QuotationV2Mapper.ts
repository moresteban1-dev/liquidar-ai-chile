import { Quotation, ProviderBid, LegacyQuotationItem } from '@core/domain/aggregates/quotation';
import { QuotationRequestedItem } from '@core/domain/aggregates/quotation/QuotationRequestedItem';
import { QuotationProviderItem } from '@core/domain/aggregates/quotation/QuotationProviderItem';
import { QuotationClientItem } from '@core/domain/aggregates/quotation/QuotationClientItem';
import { BidItem } from '@core/domain/aggregates/quotation/BidItem';
import { Money, Currency } from '@core/domain/value-objects/Money';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { Result } from '@core/shared/Result';
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing';

/** Extract category name from brief like "[Categoría: iluminacion] ..." */
function extractServiceFromBrief(brief: string): string | null {
    if (!brief || typeof brief !== 'string') return null;
    const match = brief.match(/\[Categor[ií]a:\s*([^\]]+)\]/i);
    return match && match[1] ? match[1].trim() : null;
}

/**
 * Persistence row for the core quotation table
 */
export interface QuotationRow {
    id: string;
    client_id: string;
    service_id?: string | null;
    code: string;
    status: string;
    created_at: string;
    updated_at: string;
    valid_until?: string | null;
    selected_bid_id?: string | null;
    assigned_provider_id?: string | null;
    event_start_date?: string | null;
    event_address?: string | null;
    event_end_time?: string | null;
    brief?: string | null;
    client_rut?: string | null;
    provider_notes?: string | null;
    admin_notes?: string | null;
    rejection_reason?: string | null;
    service?: { name: string } | null;
    subtotal_services_provider?: number;
    subtotal_logistics_provider?: number;
    total_provider_net?: number;
    commission_services_net?: number;
    commission_logistics_net?: number;
    total_commission_net?: number;
    commission_method?: string;
    total_net?: number;
    total_iva?: number;
    total_with_iva?: number;
    price_cost?: number;
    price_net?: number;
    price_iva?: number;
    price_total?: number;
    markup_percentage?: number;
    provider_suggests_technical_visit?: boolean;
    technical_visit?: boolean;
    assigned_at?: string | null;
    provider_quoted_at?: string | null;
    sent_to_client_at?: string | null;
    approved_at?: string | null;
    rejected_at?: string | null;
    paid_at?: string | null;
}

export interface QuotationItemRow {
    id: string;
    quotation_id: string;
    item_name?: string;
    description?: string;
    category?: string;
    quantity: number;
    unit_price_net?: number;
    total_price_net?: number;
    sort_order: number;
}

export interface BidRow {
    id: string;
    provider_id: string;
    delivery_days: number;
    notes?: string;
    created_at: string;
}

export interface BidItemRow {
    id: string;
    bid_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    currency: string;
    category?: string;
}

/**
 * NASA-Grade Aggregate Row for Quotations
 */
export interface QuotationAggregateRow {
    quotation: QuotationRow;
    requestedItems?: QuotationItemRow[];
    providerItems?: QuotationItemRow[];
    clientItems?: QuotationItemRow[];
    legacyItems?: QuotationItemRow[];
    bids?: BidRow[];
    bidItems?: BidItemRow[];
}

/**
 * NASA-Grade Engineering: Quotation V2 Mapper
 */
export class QuotationV2Mapper {
    
    public static toDomain(row: QuotationAggregateRow): Result<Quotation, string> {
        try {
            const qRow = row.quotation;
            const reqItems = row.requestedItems || [];
            const provItems = row.providerItems || [];
            const cliItems = row.clientItems || [];
            const legacyItems = row.legacyItems || [];
            const bidsRows = row.bids || [];
            const bidItemsRows = row.bidItems || [];

            // 1. Map Items (V2 prioritized, Fallback to V1)
            const requestedItems = reqItems.map(itemRow => 
                QuotationRequestedItem.reconstitute({
                    itemName: itemRow.item_name || 'Item sin nombre',
                    quantity: itemRow.quantity,
                    sortOrder: itemRow.sort_order
                }, itemRow.id)
            );

            const providerItems = provItems.map(itemRow => 
                QuotationProviderItem.reconstitute({
                    category: (itemRow.category as 'SERVICIO' | 'LOGISTICA') || 'SERVICIO',
                    concept: itemRow.item_name || 'Concepto sin nombre',
                    quantity: itemRow.quantity,
                    unitPriceNet: Money.reconstitute(itemRow.unit_price_net || 0, 'CLP'),
                    totalPriceNet: Money.reconstitute(itemRow.total_price_net || 0, 'CLP'),
                    sortOrder: itemRow.sort_order
                }, itemRow.id)
            );

            const clientItems = cliItems.map(itemRow => 
                QuotationClientItem.reconstitute({
                    description: itemRow.description || itemRow.item_name || 'Item sin descripción',
                    quantity: itemRow.quantity,
                    unitPriceNet: Money.reconstitute(itemRow.unit_price_net || 0, 'CLP'),
                    totalPriceNet: Money.reconstitute(itemRow.total_price_net || 0, 'CLP'),
                    sortOrder: itemRow.sort_order
                }, itemRow.id)
            );

            // 2. Legacy Mapping (V1 support)
            const items: LegacyQuotationItem[] = legacyItems.map(itemRow => 
                ({
                    description: itemRow.description || itemRow.item_name || 'Item',
                    quantity: itemRow.quantity,
                    unitCost: itemRow.unit_price_net || 0
                })
            );

            const bids: ProviderBid[] = [];
            for (const bidRow of bidsRows) {
                const myItems = bidItemsRows.filter(i => i.bid_id === bidRow.id);
                const bidItems = myItems.map(i => {
                    const moneyRes = Money.create(i.unit_price, (i.currency as Currency) || 'CLP');
                    const unitPrice = moneyRes.isSuccess() ? moneyRes.getValue() : Money.create(0).getValue();
                    return BidItem.reconstitute({
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice,
                        category: (i.category as 'SERVICE' | 'LOGISTICS' | 'OTHER') || 'SERVICE'
                    }, i.id);
                });

                const bidResult = ProviderBid.reconstitute({
                    providerId: bidRow.provider_id,
                    items: bidItems,
                    deliveryDays: bidRow.delivery_days,
                    notes: bidRow.notes,
                    createdAt: new Date(bidRow.created_at)
                }, bidRow.id);

                if (bidResult.isSuccess()) {
                    bids.push(bidResult.getValue());
                }
            }

            const createdAt = new Date(qRow.created_at);
            const expiresAt = qRow.valid_until ? new Date(qRow.valid_until) : new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

            const quotationId = String(qRow.id || '');
            const clientId = String(qRow.client_id || '');
            const serviceId = String(qRow.service_id || '');
            const status = qRow.status || 'DRAFT';

            // 3. Pricing Reconstitution
            const pricingRes = QuotationPricing.fromBreakdown({
                providerCost: Money.reconstitute(qRow.total_provider_net || qRow.price_cost || 0, 'CLP'),
                adminCommission: Money.reconstitute(qRow.total_commission_net || (qRow.total_net && qRow.total_provider_net ? qRow.total_net - qRow.total_provider_net : 0) || 0, 'CLP'),
                platformFee: Money.zero(),
                taxes: Money.reconstitute(qRow.total_iva || qRow.price_iva || 0, 'CLP'),
                finalPrice: Money.reconstitute(qRow.total_with_iva || qRow.price_total || 0, 'CLP')
            });

            const quotationResult = Quotation.reconstitute({
                orderId: new UniqueEntityID(qRow.service_id || qRow.id),
                providerId: new UniqueEntityID(qRow.assigned_provider_id || ''),
                clientId,
                serviceId: qRow.service_id || 'GENERIC',
                code: String(qRow.code || ''),
                status,
                requestedItems,
                providerItems,
                clientItems,
                items,
                pricing: pricingRes.getValue(),
                serviceDescription: String(qRow.brief || ''),
                includes: [],
                excludes: [],
                validUntil: expiresAt,
                estimatedDeliveryDays: 0,
                
                eventDate: qRow.event_start_date ? new Date(qRow.event_start_date) : createdAt,
                eventAddress: qRow.event_address ? String(qRow.event_address) : undefined,
                eventEndTime: qRow.event_end_time ? String(qRow.event_end_time) : undefined,
                brief: qRow.brief ? String(qRow.brief) : undefined,
                clientRut: qRow.client_rut ? String(qRow.client_rut) : undefined,
                providerNotes: qRow.provider_notes ? String(qRow.provider_notes) : undefined,
                adminNotes: qRow.admin_notes ? String(qRow.admin_notes) : undefined,
                rejectionReason: qRow.rejection_reason ? String(qRow.rejection_reason) : undefined,
                serviceName: (qRow.service && typeof qRow.service === 'object' && 'name' in qRow.service) 
                    ? String((qRow.service as any).name) 
                    : (qRow.brief ? extractServiceFromBrief(String(qRow.brief)) || undefined : undefined),
                
                subtotalServicesProvider: Money.reconstitute(qRow.subtotal_services_provider || 0, 'CLP'),
                subtotalLogisticsProvider: Money.reconstitute(qRow.subtotal_logistics_provider || 0, 'CLP'),
                totalProviderNet: Money.reconstitute(qRow.total_provider_net || 0, 'CLP'),
                commissionServicesNet: Money.reconstitute(qRow.commission_services_net || 0, 'CLP'),
                commissionLogisticsNet: Money.reconstitute(qRow.commission_logistics_net || 0, 'CLP'),
                totalCommissionNet: Money.reconstitute(qRow.total_commission_net || 0, 'CLP'),
                commissionMethod: qRow.commission_method || 'PORCENTAJE',
                totalNet: Money.reconstitute(qRow.total_net || 0, 'CLP'),
                totalIva: Money.reconstitute(qRow.total_iva || 0, 'CLP'),
                totalWithIva: Money.reconstitute(qRow.total_with_iva || 0, 'CLP'),
    
                expiresAt,
                createdAt,
                updatedAt: qRow.updated_at ? new Date(qRow.updated_at) : new Date(),
                providerSuggestsTechnicalVisit: !!qRow.provider_suggests_technical_visit,
                technicalVisit: !!qRow.technical_visit,
                assignedAt: qRow.assigned_at ? new Date(qRow.assigned_at) : undefined,
                providerQuotedAt: qRow.provider_quoted_at ? new Date(qRow.provider_quoted_at) : undefined,
                sentToClientAt: qRow.sent_to_client_at ? new Date(qRow.sent_to_client_at) : undefined,
                approvedAt: qRow.approved_at ? new Date(qRow.approved_at) : undefined,
                rejectedAt: qRow.rejected_at ? new Date(qRow.rejected_at) : undefined,
                paidAt: qRow.paid_at ? new Date(qRow.paid_at) : undefined,
                bids
            }, new UniqueEntityID(quotationId));
    
            return quotationResult;
        } catch (err: unknown) {
            return Result.fail(err instanceof Error ? err.message : 'Error desconocido en QuotationV2Mapper.toDomain');
        }
    }

    public static toPersistence(quotation: Quotation): Result<QuotationAggregateRow, string> {
        try {
            const row: QuotationAggregateRow = {
                quotation: {
                    id: quotation.quotationId.toString(),
                    client_id: quotation.clientId,
                    service_id: (quotation.serviceId && quotation.serviceId !== 'GENERIC') ? quotation.serviceId : null,
                    status: quotation.status,
                    code: quotation.code,
                    created_at: quotation.createdAt.toISOString(),
                    updated_at: quotation.updatedAt.toISOString(),
                    selected_bid_id: quotation.acceptedBidId || null,
                    assigned_provider_id: quotation.assignedProviderId || null,
                    event_start_date: quotation.props.eventDate ? quotation.props.eventDate.toISOString() : null,
                    valid_until: quotation.props.validUntil ? quotation.props.validUntil.toISOString() : null,
                    brief: quotation.props.brief || quotation.props.serviceDescription || null,
                    
                    client_rut: quotation.clientRut ?? null,
                    event_address: quotation.eventAddress ?? null,
                    event_end_time: quotation.eventEndTime ?? null,
                    provider_notes: quotation.providerNotes ?? null,
                    admin_notes: quotation.props.adminNotes ?? null,
                    rejection_reason: quotation.rejectionReason ?? null,
                    technical_visit: quotation.technicalVisit ?? false,
                    provider_suggests_technical_visit: quotation.providerSuggestsTechnicalVisit ?? false,
    
                    subtotal_services_provider: quotation.subtotalServicesProvider.amount,
                    subtotal_logistics_provider: quotation.subtotalLogisticsProvider.amount,
                    total_provider_net: quotation.totalProviderNet.amount,
                    commission_services_net: quotation.commissionServicesNet.amount,
                    commission_logistics_net: quotation.commissionLogisticsNet.amount,
                    total_commission_net: quotation.totalCommissionNet.amount,
                    commission_method: quotation.commissionMethod,
                    total_net: quotation.totalNet.amount,
                    total_iva: quotation.totalIva.amount,
                    total_with_iva: quotation.totalWithIva.amount,
    
                    assigned_at: quotation.assignedAt?.toISOString() ?? null,
                    provider_quoted_at: quotation.providerQuotedAt?.toISOString() ?? null,
                    sent_to_client_at: quotation.sentToClientAt?.toISOString() ?? null,
                    approved_at: quotation.approvedAt?.toISOString() ?? null,
                    rejected_at: quotation.rejectedAt?.toISOString() ?? null,
                    paid_at: quotation.paidAt?.toISOString() ?? null,
                    
                    price_cost: quotation.totalProviderNet.amount,
                    price_net: quotation.totalNet.amount,
                    price_iva: quotation.totalIva.amount,
                    price_total: quotation.totalWithIva.amount
                },
                requestedItems: quotation.requestedItems.map(i => ({
                    id: i.id,
                    quotation_id: quotation.quotationId.toString(),
                    item_name: i.itemName,
                    quantity: i.quantity,
                    sort_order: i.sortOrder
                })),
                providerItems: quotation.providerItems.map(i => ({
                    id: i.id,
                    quotation_id: quotation.quotationId.toString(),
                    item_name: i.concept,
                    quantity: i.quantity,
                    unit_price_net: i.unitPriceNet.amount,
                    total_price_net: i.totalPriceNet.amount,
                    sort_order: i.sortOrder,
                    category: i.category
                })),
                clientItems: quotation.clientItems.map(i => ({
                    id: i.id,
                    quotation_id: quotation.quotationId.toString(),
                    item_name: i.description,
                    quantity: i.quantity,
                    unit_price_net: i.unitPriceNet.amount,
                    total_price_net: i.totalPriceNet.amount,
                    sort_order: i.sortOrder
                }))
            };
            return Result.ok(row);
        } catch (err: unknown) {
            return Result.fail(err instanceof Error ? err.message : 'Error desconocido en QuotationV2Mapper.toPersistence');
        }
    }
}
