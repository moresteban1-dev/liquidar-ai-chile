import { AggregateRoot } from '@core/shared/AggregateRoot';
import { Result, ok, fail } from '@core/shared/Result';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { DomainEvent } from '@core/shared/DomainEvent';
import { Money } from '@core/domain/value-objects/Money';
import { QuotationPricing } from '../order/QuotationPricing';
import { QuotationSent } from '@core/domain/events/QuotationSent';
import { QuotationApproved } from '@core/domain/events/QuotationApproved';
import { QuotationRejected } from '@core/domain/events/QuotationRejected';
import { QuotationProviderItem } from './QuotationProviderItem';
import { QuotationClientItem } from './QuotationClientItem';
import { QuotationRequestedItem } from './QuotationRequestedItem';
import { ProviderBid } from './ProviderBid';

interface QuotationItem {
  id: string;
  itemName: string;
  quantity: number;
  unitCost: Money;
  description: string;
}

export interface LegacyQuotationItem {
  description: string;
  quantity: number;
  unitCost: number;
  total?: number;
}

export interface QuotationProps {
  orderId: UniqueEntityID;
  providerId: UniqueEntityID;
  status: string;
  pricing: QuotationPricing;
  serviceDescription: string;
  includes: string[];
  excludes: string[];
  validUntil: Date;
  estimatedDeliveryDays: number;
  providerNotes?: string;
  adminNotes?: string;
  rejectionReason?: string;
  submittedAt?: Date;
  sentToClientAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  clientNotes?: string;
  requestedItems: QuotationRequestedItem[];
  providerItems: QuotationProviderItem[];
  clientItems: QuotationClientItem[];
  items: LegacyQuotationItem[];
  brief?: string;
  eventDate: Date;
  clientId: string;
  serviceId: string;
  code: string;
  subtotalServicesProvider: Money;
  subtotalLogisticsProvider: Money;
  totalProviderNet: Money;
  commissionServicesNet: Money;
  commissionLogisticsNet: Money;
  totalCommissionNet: Money;
  commissionMethod: string;
  totalNet: Money;
  totalIva: Money;
  totalWithIva: Money;
  providerSuggestsTechnicalVisit: boolean;
  technicalVisit: boolean;
  expiresAt: Date;
  eventLocation?: string;
  clientEmail?: string;
  eventAddress?: string;
  eventEndTime?: string;
  serviceName?: string;
  clientRut?: string;
  assignedAt?: Date;
  providerQuotedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  bids?: ProviderBid[]; 
  acceptedBidId?: string;
  assignedProviderId?: string;
}

/**
 * Quotation Aggregate (V2)
 * 
 * Represents a single provider's offer for an order.
 */
export class Quotation extends AggregateRoot<QuotationProps> {
  private constructor(props: QuotationProps, id?: UniqueEntityID) {
    super(props, id);
  }

  get quotationId(): UniqueEntityID {
    return this._id;
  }

  get orderId(): UniqueEntityID {
    return this.props.orderId;
  }

  get providerId(): UniqueEntityID {
    return this.props.providerId;
  }

  get status(): string {
    return this.props.status;
  }

  get pricing(): QuotationPricing {
    return this.props.pricing;
  }

  get serviceDescription(): string {
    return this.props.serviceDescription;
  }

  get includes(): string[] {
    return this.props.includes;
  }

  get excludes(): string[] {
    return this.props.excludes;
  }

  get validUntil(): Date {
    return this.props.validUntil;
  }

  get estimatedDeliveryDays(): number {
    return this.props.estimatedDeliveryDays;
  }

  get canBeModified(): boolean {
    return ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_PROVIDER_BID'].includes(this.props.status);
  }

  get priceTotalAmount(): number {
    return this.props.pricing?.finalPrice?.amount || 0;
  }

  get requestedItems(): QuotationRequestedItem[] {
    return this.props.requestedItems || [];
  }

  get providerItems(): QuotationProviderItem[] {
    return this.props.providerItems || [];
  }

  get clientItems(): QuotationClientItem[] {
    return this.props.clientItems || [];
  }

  get acceptedBidId(): string | undefined {
    return this.props.acceptedBidId;
  }

  get assignedProviderId(): string | undefined {
    return this.props.assignedProviderId;
  }

  get brief(): string {
    return this.props.brief || '';
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get serviceId(): string {
    return this.props.serviceId;
  }

  get code(): string {
    return this.props.code;
  }

  get items(): LegacyQuotationItem[] {
    return this.props.items || [];
  }

  get clientRut(): string | undefined {
    return this.props.clientRut;
  }

  get eventAddress(): string | undefined {
    return this.props.eventAddress;
  }

  get eventEndTime(): string | undefined {
    return this.props.eventEndTime;
  }

  get providerNotes(): string | undefined {
    return this.props.providerNotes;
  }

  get serviceName(): string {
    return this.props.serviceName || 'Servicio General';
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  get subtotalServicesProvider(): Money {
    return this.props.subtotalServicesProvider;
  }

  get subtotalLogisticsProvider(): Money {
    return this.props.subtotalLogisticsProvider;
  }

  get totalProviderNet(): Money {
    return this.props.totalProviderNet;
  }

  get commissionServicesNet(): Money {
    return this.props.commissionServicesNet;
  }

  get commissionLogisticsNet(): Money {
    return this.props.commissionLogisticsNet;
  }

  get totalCommissionNet(): Money {
    return this.props.totalCommissionNet;
  }

  get commissionMethod(): string {
    return this.props.commissionMethod;
  }

  get totalNet(): Money {
    return this.props.totalNet;
  }

  get totalIva(): Money {
    return this.props.totalIva;
  }

  get totalWithIva(): Money {
    return this.props.totalWithIva;
  }

  get assignedAt(): Date | undefined {
    return this.props.assignedAt;
  }

  get providerQuotedAt(): Date | undefined {
    return this.props.providerQuotedAt;
  }

  get sentToClientAt(): Date | undefined {
    return this.props.sentToClientAt;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get rejectedAt(): Date | undefined {
    return this.props.rejectedAt;
  }

  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }

  get providerSuggestsTechnicalVisit(): boolean {
    return !!this.props.providerSuggestsTechnicalVisit;
  }

  get technicalVisit(): boolean {
    return !!this.props.technicalVisit;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updatePricing(pricing: QuotationPricing): Result<void, string> {
    if (!this.canBeModified) {
      return fail('No se puede actualizar el precio en el estado actual');
    }
    this.props.pricing = pricing;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public addProviderNotes(notes: string): void {
    this.props.providerNotes = notes;
    this.props.updatedAt = new Date();
  }

  public static create(props: Omit<QuotationProps, 'updatedAt'>, id?: UniqueEntityID): Result<Quotation, string> {
    const quotation = new Quotation({
      ...props,
      updatedAt: new Date()
    }, id);
    
    return ok(quotation);
  }

  public static reconstitute(props: QuotationProps, id?: UniqueEntityID): Result<Quotation, string> {
    return ok(new Quotation(props, id));
  }

  public submit(): Result<void, string> {
    if (this.props.status !== 'DRAFT') {
      return fail('Solo se pueden enviar cotizaciones en borrador');
    }

    this.props.status = 'SUBMITTED';
    this.props.submittedAt = new Date();
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public analyze(): Result<void, string> {
    if (this.props.status !== 'SUBMITTED') {
      return fail('La cotización debe estar en estado SUBMITTED para ser analizada');
    }

    this.props.status = 'ANALYZING';
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public cancel(reason: string): Result<void, string> {
    this.props.status = 'CANCELLED';
    this.props.rejectionReason = reason;
    this.props.updatedAt = new Date();

    return ok(undefined);
  }

  public addItem(item: QuotationItem): Result<void, string> {
    this.props.requestedItems = this.props.requestedItems || [];
    this.props.requestedItems.push(item as unknown as QuotationRequestedItem);
    this.version = this.version > 0 ? this.version + 1 : 2;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public removeItem(itemId: string): Result<void, string> {
    this.props.requestedItems = (this.props.requestedItems || []).filter((i: QuotationRequestedItem) => i.id.toString() !== itemId);
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public markUnderReview(): Result<void, string> {
    if (this.props.status !== 'SUBMITTED') {
      return fail('La cotización debe estar enviada para revisión');
    }

    this.props.status = 'UNDER_REVIEW';
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public sendToClient(): Result<void, string> {
    const allowed = ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_CLIENT_PAYMENT'];
    if (!allowed.includes(this.props.status)) {
      return fail(`No se puede enviar al cliente desde el estado: ${this.props.status}`);
    }

    if (this.isExpired()) {
      return fail('No se puede enviar una cotización vencida');
    }

    this.props.status = 'SENT_TO_CLIENT';
    this.props.sentToClientAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(new QuotationSent(
      this.id,
      this.props.orderId,
      this.props.providerId,
      this.props.pricing.finalPrice.amount,
      this.props.pricing.finalPrice.currency
    ));

    return ok(undefined);
  }

  public approve(_markupPercentage?: number): Result<void, string> {
    if (this.props.status !== 'SENT_TO_CLIENT' && this.props.status !== 'UNDER_REVIEW') {
      return fail('Solo se pueden aprobar cotizaciones enviadas al cliente o en revisión');
    }

    if (this.isExpired()) {
      return fail('No se puede aprobar una cotización vencida');
    }

    this.props.status = 'APPROVED';
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(new QuotationApproved(
      this.id,
      this.props.orderId
    ));

    return ok(undefined);
  }

  public sendToProviders(): Result<void, string> {
    if (this.props.status !== 'DRAFT') return fail('Solo se pueden enviar a proveedores desde borrador');
    this.props.status = 'PENDING_ASSIGNMENT';
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public returnToProvider(): Result<void, string> {
    this.props.status = 'PENDING_PROVIDER_BID';
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public selectBid(bidId: string): Result<void, string> {
    this.props.acceptedBidId = bidId;
    this.props.status = 'AWAITING_CLIENT_PAYMENT';
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public assignProvider(providerId: string | UniqueEntityID, items?: QuotationRequestedItem[]): Result<void, string> {
    const pId = typeof providerId === 'string' ? new UniqueEntityID(providerId) : providerId;
    this.props.assignedProviderId = pId.toString();
    this.props.providerId = pId;
    if (items) this.props.requestedItems = items;
    this.props.status = 'PENDING_PROVIDER_BID';
    this.props.assignedAt = new Date();
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public markAsPaid(): Result<void, string> {
    this.props.status = 'PAID';
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public updateRequestedItems(items: QuotationRequestedItem[]): Result<void, string> {
    if (!this.canBeModified) return fail('No se pueden actualizar items en el estado actual');
    this.props.requestedItems = items;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public updateProviderItems(items: QuotationProviderItem[]): Result<void, string> {
    if (!this.canBeModified) return fail('No se pueden actualizar items en el estado actual');
    this.props.providerItems = items;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public updateClientItems(items: QuotationClientItem[]): Result<void, string> {
    if (!this.canBeModified) return fail('No se pueden actualizar items en el estado actual');
    this.props.clientItems = items;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public applyAISuggestions(providerItems: QuotationProviderItem[], clientItems: QuotationClientItem[]): Result<void, string> {
    if (this.props.status !== 'ANALYZING') return fail('Solo se pueden aplicar sugerencias en estado ANALYZING');
    this.props.providerItems = providerItems;
    this.props.clientItems = clientItems;
    this.props.status = 'OPTIMIZED';
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public reject(reason: string): Result<void, string> {
    if (this.props.status !== 'SENT_TO_CLIENT') {
      return fail('Solo se pueden rechazar cotizaciones enviadas al cliente');
    }

    if (!reason || reason.trim().length < 5) {
      return fail('La razón de rechazo debe tener al menos 5 caracteres');
    }

    this.props.status = 'REJECTED';
    this.props.rejectionReason = reason;
    this.props.rejectedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(new QuotationRejected(
      this.id.toString(),
      this.props.orderId.toString(),
      reason
    ));

    return ok(undefined);
  }

  public addAdminNotes(notes: string): Result<void, string> {
    this.props.adminNotes = notes;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public addClientNotes(notes: string): Result<void, string> {
    this.props.clientNotes = notes;
    this.props.updatedAt = new Date();
    return ok(undefined);
  }

  public isExpired(): boolean {
    return new Date() > this.props.validUntil;
  }

  protected applyEvent(_event: DomainEvent): void {}
}
