import { Quotation, QuotationProps } from '@core/domain/aggregates/quotation/Quotation'
import { Money, Currency } from '@core/domain/value-objects/Money'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { Result } from '@core/shared/Result'
import { QuotationPricing } from '@core/domain/aggregates/order/QuotationPricing'

/**
 * QuotationPersistence
 * 
 * Estructura de datos técnica para la tabla 'quotations' de Supabase (V2).
 */
export interface QuotationPersistence {
  id: string
  client_id: string
  provider_id: string
  service_id: string
  code: string
  status: string
  event_date: string
  event_location?: string
  event_address?: string
  event_end_time?: string
  service_name?: string
  service_description?: string
  brief?: string
  client_rut?: string
  client_email?: string
  provider_notes?: string
  rejection_reason?: string
  valid_until?: string
  estimated_delivery_days?: number
  items?: any[] | null
  provider_suggests_technical_visit: boolean
  technical_visit: boolean
  
  // Financieros
  subtotal_services_provider: number
  subtotal_logistics_provider: number
  total_provider_net: number
  commission_services_net: number
  commission_logistics_net: number
  total_commission_net: number
  commission_method: string
  total_net: number
  total_iva: number
  total_with_iva: number
  currency: string
  
  // Metadatos y Auditoría
  created_at: string
  expires_at: string
  updated_at?: string
  assigned_at?: string
  provider_quoted_at?: string
  sent_to_client_at?: string
  approved_at?: string
  rejected_at?: string
  paid_at?: string
  deleted_at?: string
}

export class QuotationMapper {
  /**
   * Persistence → Domain
   */
  public toDomain(raw: QuotationPersistence): Result<Quotation, string> {
    try {
      if (!raw.id || !raw.client_id || !raw.service_id) {
        return Result.fail('Missing required fields in quotation persistence data')
      }

      const currency = (raw.currency || 'USD') as Currency
      const zero = Money.create(0, currency).unwrap()

      const props: QuotationProps = {
        orderId: new UniqueEntityID(raw.service_id),
        providerId: new UniqueEntityID(raw.provider_id),
        clientId: raw.client_id,
        serviceId: raw.service_id,
        code: raw.code,
        status: raw.status,
        serviceDescription: raw.service_description || raw.service_name || 'Sin descripción',
        includes: [],
        excludes: [],
        validUntil: raw.valid_until ? new Date(raw.valid_until) : new Date(raw.expires_at),
        estimatedDeliveryDays: raw.estimated_delivery_days || 0,
        eventDate: new Date(raw.event_date),
        eventLocation: raw.event_location,
        eventAddress: raw.event_address,
        eventEndTime: raw.event_end_time,
        serviceName: raw.service_name,
        brief: raw.brief,
        clientRut: raw.client_rut,
        clientEmail: raw.client_email,
        providerNotes: raw.provider_notes,
        rejectionReason: raw.rejection_reason,
        providerSuggestsTechnicalVisit: !!raw.provider_suggests_technical_visit,
        technicalVisit: !!raw.technical_visit,
        
        requestedItems: [], 
        providerItems: [],
        clientItems: [],
        items: (raw.items as any) || [],

        subtotalServicesProvider: Money.create(raw.subtotal_services_provider, currency).unwrapOr(zero),
        subtotalLogisticsProvider: Money.create(raw.subtotal_logistics_provider, currency).unwrapOr(zero),
        totalProviderNet: Money.create(raw.total_provider_net, currency).unwrapOr(zero),
        commissionServicesNet: Money.create(raw.commission_services_net, currency).unwrapOr(zero),
        commissionLogisticsNet: Money.create(raw.commission_logistics_net, currency).unwrapOr(zero),
        totalCommissionNet: Money.create(raw.total_commission_net, currency).unwrapOr(zero),
        commissionMethod: (raw.commission_method as 'PORCENTAJE' | 'FIJO') || 'PORCENTAJE',
        totalNet: Money.create(raw.total_net, currency).unwrapOr(zero),
        totalIva: Money.create(raw.total_iva, currency).unwrapOr(zero),
        totalWithIva: Money.create(raw.total_with_iva, currency).unwrapOr(zero),
        
        pricing: QuotationPricing.create({
          providerCost: raw.total_provider_net || 0,
          adminMargin: raw.total_commission_net || 0,
          clientPrice: raw.total_with_iva || 0,
          currency: currency
        }).unwrapOr(QuotationPricing.fromBreakdown({
            providerCost: zero,
            adminCommission: zero,
            platformFee: zero,
            taxes: zero,
            finalPrice: zero
        }).getValue()),

        createdAt: new Date(raw.created_at),
        expiresAt: new Date(raw.expires_at),
        updatedAt: raw.updated_at ? new Date(raw.updated_at) : new Date(raw.created_at),
        assignedAt: raw.assigned_at ? new Date(raw.assigned_at) : undefined,
        providerQuotedAt: raw.provider_quoted_at ? new Date(raw.provider_quoted_at) : undefined,
        sentToClientAt: raw.sent_to_client_at ? new Date(raw.sent_to_client_at) : undefined,
        approvedAt: raw.approved_at ? new Date(raw.approved_at) : undefined,
        rejectedAt: raw.rejected_at ? new Date(raw.rejected_at) : undefined,
        paidAt: raw.paid_at ? new Date(raw.paid_at) : undefined
      }

      return Quotation.reconstitute(props, new UniqueEntityID(raw.id))

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown mapping error';
      return Result.fail(`Error al mapear cotización a dominio: ${message}`)
    }
  }

  /**
   * Domain → Persistence
   */
  public toPersistence(quotation: Quotation): QuotationPersistence {
    const data: QuotationPersistence = {
      id: quotation.id.toString(),
      client_id: quotation.clientId,
      provider_id: quotation.providerId.toString(),
      service_id: quotation.serviceId,
      code: quotation.code,
      status: quotation.status,
      service_description: quotation.serviceDescription,
      valid_until: quotation.validUntil.toISOString(),
      estimated_delivery_days: quotation.estimatedDeliveryDays,
      event_date: quotation.props.eventDate.toISOString(),
      provider_suggests_technical_visit: quotation.props.providerSuggestsTechnicalVisit,
      technical_visit: quotation.props.technicalVisit,
      subtotal_services_provider: quotation.props.subtotalServicesProvider.amount,
      subtotal_logistics_provider: quotation.props.subtotalLogisticsProvider.amount,
      total_provider_net: quotation.props.totalProviderNet.amount,
      commission_services_net: quotation.props.commissionServicesNet.amount,
      commission_logistics_net: quotation.props.commissionLogisticsNet.amount,
      total_commission_net: quotation.props.totalCommissionNet.amount,
      commission_method: quotation.props.commissionMethod,
      total_net: quotation.props.totalNet.amount,
      total_iva: quotation.props.totalIva.amount,
      total_with_iva: quotation.props.totalWithIva.amount,
      currency: quotation.props.totalNet.currency,
      created_at: quotation.props.createdAt.toISOString(),
      expires_at: quotation.props.expiresAt.toISOString()
    };

    if (quotation.props.eventLocation) data.event_location = quotation.props.eventLocation;
    if (quotation.props.eventAddress) data.event_address = quotation.props.eventAddress;
    if (quotation.props.eventEndTime) data.event_end_time = quotation.props.eventEndTime;
    if (quotation.props.serviceName) data.service_name = quotation.props.serviceName;
    if (quotation.props.brief) data.brief = quotation.props.brief;
    if (quotation.props.clientRut) data.client_rut = quotation.props.clientRut;
    if (quotation.props.clientEmail) data.client_email = quotation.props.clientEmail;
    if (quotation.props.providerNotes) data.provider_notes = quotation.props.providerNotes;
    if (quotation.props.rejectionReason) data.rejection_reason = quotation.props.rejectionReason;
    if (quotation.props.items) data.items = quotation.props.items;
    if (quotation.props.updatedAt) data.updated_at = quotation.props.updatedAt.toISOString();
    if (quotation.props.assignedAt) data.assigned_at = quotation.props.assignedAt.toISOString();
    if (quotation.props.providerQuotedAt) data.provider_quoted_at = quotation.props.providerQuotedAt.toISOString();
    if (quotation.props.sentToClientAt) data.sent_to_client_at = quotation.props.sentToClientAt.toISOString();
    if (quotation.props.approvedAt) data.approved_at = quotation.props.approvedAt.toISOString();
    if (quotation.props.rejectedAt) data.rejected_at = quotation.props.rejectedAt.toISOString();
    if (quotation.props.paidAt) data.paid_at = quotation.props.paidAt.toISOString();

    return data;
  }
}
