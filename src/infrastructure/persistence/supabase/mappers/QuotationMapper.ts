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
/**
 * QuotationPersistence
 * 
 * MUST match the actual `quotations` table columns from:
 *   - 001_initial_schema.sql (base table)
 *   - 20260217_quotation_flow_v2.sql (added V2 columns)
 * 
 * KEY COLUMN MAPPINGS:
 *   Domain          →  DB Column
 *   providerId      →  assigned_provider_id (NOT provider_id)
 *   status          →  public_status + internal_status (NOT status)
 *   eventDate       →  event_start_date (NOT event_date)
 *   expiresAt       →  valid_until (NOT expires_at)
 */
export interface QuotationPersistence {
  id: string
  client_id: string
  assigned_provider_id: string
  service_id: string
  code: string
  brief: string
  public_status: string
  internal_status: string
  event_start_date: string
  event_location?: string
  event_address?: string
  event_end_time?: string
  client_rut?: string
  provider_notes?: string
  rejection_reason?: string
  valid_until: string
  technical_visit: boolean
  
  // V2 Financial columns (added by 20260217_quotation_flow_v2.sql)
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
  
  // V1 Financial columns (from 001_initial_schema.sql, NOT NULL)
  price_net?: number
  price_iva?: number
  price_total?: number
  
  // Timestamps
  created_at: string
  updated_at?: string
  assigned_at?: string
  provider_quoted_at?: string
  sent_to_client_at?: string
  approved_at?: string
  rejected_at?: string
  paid_at?: string
}

export class QuotationMapper {
  /**
   * Persistence → Domain
   * 
   * Accepts raw Supabase rows which may contain V1 or V2 column names.
   * Defensively maps both old and new column naming conventions.
   */
  public toDomain(raw: any): Result<Quotation, string> {
    try {
      if (!raw.id || !raw.client_id || !raw.service_id) {
        return Result.fail('Missing required fields in quotation persistence data')
      }

      const currency = (raw.currency || 'CLP') as Currency
      const zero = Money.create(0, currency).unwrap()

      const props: QuotationProps = {
        orderId: new UniqueEntityID(raw.service_id),
        providerId: new UniqueEntityID(raw.assigned_provider_id || raw.provider_id || 'pending'),
        clientId: raw.client_id,
        serviceId: raw.service_id,
        code: raw.code,
        status: raw.internal_status || raw.public_status || raw.status || 'PENDING_ASSIGNMENT',
        serviceDescription: raw.brief || raw.service_description || raw.service_name || 'Sin descripción',
        includes: [],
        excludes: [],
        validUntil: new Date(raw.valid_until || raw.expires_at || Date.now()),
        estimatedDeliveryDays: raw.estimated_delivery_days || 0,
        eventDate: new Date(raw.event_start_date || raw.event_date || Date.now()),
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

        subtotalServicesProvider: Money.create(raw.subtotal_services_provider || 0, currency).unwrapOr(zero),
        subtotalLogisticsProvider: Money.create(raw.subtotal_logistics_provider || 0, currency).unwrapOr(zero),
        totalProviderNet: Money.create(raw.total_provider_net || 0, currency).unwrapOr(zero),
        commissionServicesNet: Money.create(raw.commission_services_net || 0, currency).unwrapOr(zero),
        commissionLogisticsNet: Money.create(raw.commission_logistics_net || 0, currency).unwrapOr(zero),
        totalCommissionNet: Money.create(raw.total_commission_net || 0, currency).unwrapOr(zero),
        commissionMethod: (raw.commission_method as 'PORCENTAJE' | 'FIJO') || 'PORCENTAJE',
        totalNet: Money.create(raw.total_net || raw.price_net || 0, currency).unwrapOr(zero),
        totalIva: Money.create(raw.total_iva || raw.price_iva || 0, currency).unwrapOr(zero),
        totalWithIva: Money.create(raw.total_with_iva || raw.price_total || 0, currency).unwrapOr(zero),
        
        pricing: QuotationPricing.create({
          providerCost: raw.total_provider_net || 0,
          adminMargin: raw.total_commission_net || 0,
          clientPrice: raw.total_with_iva || raw.price_total || 0,
          currency: currency
        }).unwrapOr(QuotationPricing.fromBreakdown({
            providerCost: zero,
            adminCommission: zero,
            platformFee: zero,
            taxes: zero,
            finalPrice: zero
        }).getValue()),

        createdAt: new Date(raw.created_at),
        expiresAt: new Date(raw.valid_until || raw.expires_at || Date.now()),
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
   * 
   * Maps domain Quotation to actual DB column names.
   * Uses assigned_provider_id, public_status, internal_status, event_start_date, valid_until.
   */
  public toPersistence(quotation: Quotation): QuotationPersistence {
    const data: QuotationPersistence = {
      id: quotation.id.toString(),
      client_id: quotation.clientId,
      assigned_provider_id: quotation.providerId.toString(),
      service_id: quotation.serviceId,
      code: quotation.code,
      brief: quotation.serviceDescription || quotation.props.brief || 'Sin descripción',
      public_status: this.mapToPublicStatus(quotation.status),
      internal_status: this.mapToInternalStatus(quotation.status),
      valid_until: quotation.validUntil.toISOString(),
      event_start_date: quotation.props.eventDate.toISOString(),
      technical_visit: quotation.props.technicalVisit,
      // V2 Financial
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
      // V1 Financial (NOT NULL constraints)
      price_net: quotation.props.totalNet.amount,
      price_iva: quotation.props.totalIva.amount,
      price_total: quotation.props.totalWithIva.amount,
      // Timestamps
      created_at: quotation.props.createdAt.toISOString(),
    };

    // Optional fields — only set if present to avoid PostgREST schema issues
    if (quotation.props.eventLocation) data.event_location = quotation.props.eventLocation;
    if (quotation.props.eventAddress) data.event_address = quotation.props.eventAddress;
    if (quotation.props.eventEndTime) data.event_end_time = quotation.props.eventEndTime;
    if (quotation.props.clientRut) data.client_rut = quotation.props.clientRut;
    if (quotation.props.providerNotes) data.provider_notes = quotation.props.providerNotes;
    if (quotation.props.rejectionReason) data.rejection_reason = quotation.props.rejectionReason;
    if (quotation.props.updatedAt) data.updated_at = quotation.props.updatedAt.toISOString();
    if (quotation.props.assignedAt) data.assigned_at = quotation.props.assignedAt.toISOString();
    if (quotation.props.providerQuotedAt) data.provider_quoted_at = quotation.props.providerQuotedAt.toISOString();
    if (quotation.props.sentToClientAt) data.sent_to_client_at = quotation.props.sentToClientAt.toISOString();
    if (quotation.props.approvedAt) data.approved_at = quotation.props.approvedAt.toISOString();
    if (quotation.props.rejectedAt) data.rejected_at = quotation.props.rejectedAt.toISOString();
    if (quotation.props.paidAt) data.paid_at = quotation.props.paidAt.toISOString();

    return data;
  }

  /**
   * Maps domain status to V1 public_status enum (quotation_public_status).
   * Enum values: RECIBIDA, EN_PROCESO, COTIZADA, APROBADA, RECHAZADA, EXPIRADA
   */
  private mapToPublicStatus(domainStatus: string): string {
    switch (domainStatus) {
      case 'PENDING_ASSIGNMENT': return 'RECIBIDA';
      case 'ASSIGNED': return 'EN_PROCESO';
      case 'PROVIDER_QUOTING': return 'EN_PROCESO';
      case 'READY_FOR_APPROVAL': return 'COTIZADA';
      case 'WAITING_CLIENT': return 'COTIZADA';
      case 'APPROVED': return 'APROBADA';
      case 'REJECTED': return 'RECHAZADA';
      case 'EXPIRED': return 'EXPIRADA';
      default: return 'RECIBIDA';
    }
  }

  /**
   * Maps domain status to V1 internal_status enum (quotation_internal_status).
   * Enum values: PENDIENTE_ASIGNACION, ASIGNADA, PROVEEDOR_COTIZANDO, READY_FOR_APPROVAL,
   *              ESPERANDO_CLIENTE, APROBADA_PENDIENTE_PAGO, PAGADA, EN_PRODUCCION,
   *              ENTREGADA, CERRADA, CANCELADA
   */
  private mapToInternalStatus(domainStatus: string): string {
    switch (domainStatus) {
      case 'PENDING_ASSIGNMENT': return 'PENDIENTE_ASIGNACION';
      case 'ASSIGNED': return 'ASIGNADA';
      case 'PROVIDER_QUOTING': return 'PROVEEDOR_COTIZANDO';
      case 'READY_FOR_APPROVAL': return 'READY_FOR_APPROVAL';
      case 'WAITING_CLIENT': return 'ESPERANDO_CLIENTE';
      case 'APPROVED': return 'APROBADA_PENDIENTE_PAGO';
      case 'PAID': return 'PAGADA';
      case 'IN_PRODUCTION': return 'EN_PRODUCCION';
      case 'DELIVERED': return 'ENTREGADA';
      case 'CLOSED': return 'CERRADA';
      case 'CANCELLED': return 'CANCELADA';
      default: return 'PENDIENTE_ASIGNACION';
    }
  }
}
