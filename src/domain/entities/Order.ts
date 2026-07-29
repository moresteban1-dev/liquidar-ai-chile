import { Result } from '../shared/Result';
import { Money } from '../value-objects/Money';
import { Rut } from '../value-objects/Rut';
import { IDomainEvent } from '../events/DomainEvent';

export type OrderPaymentStatus = 'PENDING_PAYMENT' | 'PAID' | 'PAYMENT_FAILED' | 'REFUNDED';
export type OrderFulfillmentStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  auctionId?: string;
  title: string;
  quantity: number;
  unitNetPrice: Money;
  totalNetPrice: Money;
}

export interface CreateOrderProps {
  id: string;
  buyerRut: Rut;
  sellerRut: Rut;
  items: OrderItem[];
}

export interface ReconstituteOrderProps {
  id: string;
  buyerRut: Rut;
  sellerRut: Rut;
  items: OrderItem[];
  subtotalNet: Money;
  taxIva: Money;
  totalAmount: Money;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  paymentGateway?: 'TRANSBANK' | 'KHIPU' | 'FLOW';
  paymentTransactionId?: string;
  createdAt: Date;
  paidAt?: Date;
}

/**
 * Order Aggregate Root representing a Liquidation Settlement transaction.
 * Enforces 19% Chilean IVA tax structure, order status transitions, and payment settlement events.
 */
export class Order {
  private readonly _id: string;
  private readonly _buyerRut: Rut;
  private readonly _sellerRut: Rut;
  private readonly _items: OrderItem[];
  private _subtotalNet: Money;
  private _taxIva: Money;
  private _totalAmount: Money;
  private _paymentStatus: OrderPaymentStatus;
  private _fulfillmentStatus: OrderFulfillmentStatus;
  private _paymentGateway?: 'TRANSBANK' | 'KHIPU' | 'FLOW';
  private _paymentTransactionId?: string;
  private readonly _createdAt: Date;
  private _paidAt?: Date;

  private _domainEvents: IDomainEvent[] = [];

  private constructor(props: ReconstituteOrderProps) {
    this._id = props.id;
    this._buyerRut = props.buyerRut;
    this._sellerRut = props.sellerRut;
    this._items = props.items;
    this._subtotalNet = props.subtotalNet;
    this._taxIva = props.taxIva;
    this._totalAmount = props.totalAmount;
    this._paymentStatus = props.paymentStatus;
    this._fulfillmentStatus = props.fulfillmentStatus;
    this._paymentGateway = props.paymentGateway;
    this._paymentTransactionId = props.paymentTransactionId;
    this._createdAt = props.createdAt;
    this._paidAt = props.paidAt;
  }

  /**
   * Factory method to create a new Order from auction victory or direct liquidation purchase.
   * Automatically calculates 19% Chilean IVA on Net items.
   */
  public static create(props: CreateOrderProps): Result<Order> {
    if (!props.id || props.id.trim() === '') {
      return Result.fail<Order>("OrderInvalidId: Order ID is required.");
    }
    if (!props.items || props.items.length === 0) {
      return Result.fail<Order>("OrderEmptyItems: Order must contain at least one item.");
    }

    let calculatedSubtotalNet = Money.zero();
    for (const item of props.items) {
      calculatedSubtotalNet = calculatedSubtotalNet.add(item.totalNetPrice);
    }

    const { net, iva, total } = calculatedSubtotalNet.calculateIvaFromNet();

    const order = new Order({
      id: props.id,
      buyerRut: props.buyerRut,
      sellerRut: props.sellerRut,
      items: props.items,
      subtotalNet: net,
      taxIva: iva,
      totalAmount: total,
      paymentStatus: 'PENDING_PAYMENT',
      fulfillmentStatus: 'PENDING',
      createdAt: new Date(),
    });

    // Record domain event
    order._domainEvents.push({
      eventId: `evt-order-${order.id}`,
      eventName: 'OrderCreated',
      aggregateId: order.id,
      occurredOn: new Date(),
      payload: {
        orderId: order.id,
        buyerRut: props.buyerRut.formatted,
        sellerRut: props.sellerRut.formatted,
        subtotalNet: net.value,
        taxIva: iva.value,
        totalAmount: total.value,
      },
    });

    return Result.ok<Order>(order);
  }

  public static reconstitute(props: ReconstituteOrderProps): Order {
    return new Order(props);
  }

  // Getters
  public get id(): string { return this._id; }
  public get buyerRut(): Rut { return this._buyerRut; }
  public get sellerRut(): Rut { return this._sellerRut; }
  public get items(): ReadonlyArray<OrderItem> { return [...this._items]; }
  public get subtotalNet(): Money { return this._subtotalNet; }
  public get taxIva(): Money { return this._taxIva; }
  public get totalAmount(): Money { return this._totalAmount; }
  public get paymentStatus(): OrderPaymentStatus { return this._paymentStatus; }
  public get fulfillmentStatus(): OrderFulfillmentStatus { return this._fulfillmentStatus; }
  public get paymentGateway(): 'TRANSBANK' | 'KHIPU' | 'FLOW' | undefined { return this._paymentGateway; }
  public get paymentTransactionId(): string | undefined { return this._paymentTransactionId; }
  public get createdAt(): Date { return this._createdAt; }
  public get paidAt(): Date | undefined { return this._paidAt; }
  public get domainEvents(): ReadonlyArray<IDomainEvent> { return [...this._domainEvents]; }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Confirms payment receipt from Webpay/Khipu/Flow gateway.
   */
  public markAsPaid(gateway: 'TRANSBANK' | 'KHIPU' | 'FLOW', transactionId: string, now: Date = new Date()): Result<void> {
    if (this._paymentStatus === 'PAID') {
      return Result.fail<void>("OrderAlreadyPaid: Order payment has already been confirmed.");
    }

    this._paymentStatus = 'PAID';
    this._paymentGateway = gateway;
    this._paymentTransactionId = transactionId;
    this._paidAt = now;

    // Register Outbox Domain Event
    this._domainEvents.push({
      eventId: `evt-pay-${this._id}-${transactionId}`,
      eventName: 'PaymentReceived',
      aggregateId: this._id,
      occurredOn: now,
      payload: {
        orderId: this._id,
        buyerRut: this._buyerRut.formatted,
        gateway,
        transactionId,
        amountPaid: this._totalAmount.value,
        paidAt: now.toISOString(),
      },
    });

    return Result.ok<void>();
  }
}
