import { Result } from '../shared/Result';
import { Money } from '../value-objects/Money';
import { Rut } from '../value-objects/Rut';
import { IDomainEvent, BidPlacedPayload, AuctionWonPayload } from '../events/DomainEvent';

export type AuctionStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'CANCELLED';

export interface Bid {
  id: string;
  auctionId: string;
  bidderRut: Rut;
  amount: Money;
  placedAt: Date;
}

export interface CreateAuctionProps {
  id: string;
  sellerRut: Rut;
  title: string;
  description: string;
  startingPrice: Money;
  reservePrice: Money;
  minBidIncrement: Money;
  startDate: Date;
  endDate: Date;
}

export interface ReconstituteAuctionProps {
  id: string;
  sellerRut: Rut;
  title: string;
  description: string;
  startingPrice: Money;
  currentPrice: Money;
  reservePrice: Money;
  minBidIncrement: Money;
  status: AuctionStatus;
  startDate: Date;
  endDate: Date;
  bids: Bid[];
  winningBid?: Bid;
}

/**
 * Aggregate Root representing a Real-Time Liquidation Auction.
 * Encapsulates all domain rules, state mutations, and Domain Events for bidding.
 */
export class Auction {
  private readonly _id: string;
  private readonly _sellerRut: Rut;
  private _title: string;
  private _description: string;
  private readonly _startingPrice: Money;
  private _currentPrice: Money;
  private readonly _reservePrice: Money;
  private readonly _minBidIncrement: Money;
  private _status: AuctionStatus;
  private readonly _startDate: Date;
  private _endDate: Date;
  private _bids: Bid[];
  private _winningBid?: Bid;

  private _domainEvents: IDomainEvent[] = [];

  private constructor(props: ReconstituteAuctionProps) {
    this._id = props.id;
    this._sellerRut = props.sellerRut;
    this._title = props.title;
    this._description = props.description;
    this._startingPrice = props.startingPrice;
    this._currentPrice = props.currentPrice;
    this._reservePrice = props.reservePrice;
    this._minBidIncrement = props.minBidIncrement;
    this._status = props.status;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._bids = props.bids;
    this._winningBid = props.winningBid;
  }

  /**
   * Factory method to create a new Auction Aggregate Root.
   */
  public static create(props: CreateAuctionProps): Result<Auction> {
    if (!props.id || props.id.trim() === '') {
      return Result.fail<Auction>("AuctionInvalidId: Auction ID is required.");
    }
    if (!props.title || props.title.trim().length < 5) {
      return Result.fail<Auction>("AuctionInvalidTitle: Title must be at least 5 characters long.");
    }
    if (props.endDate <= props.startDate) {
      return Result.fail<Auction>("AuctionInvalidDates: End date must be strictly after start date.");
    }

    const auction = new Auction({
      ...props,
      currentPrice: props.startingPrice,
      status: 'DRAFT',
      bids: [],
    });

    return Result.ok<Auction>(auction);
  }

  /**
   * Reconstitute an Auction from storage/DB mapper.
   */
  public static reconstitute(props: ReconstituteAuctionProps): Auction {
    return new Auction(props);
  }

  // Getters
  public get id(): string { return this._id; }
  public get sellerRut(): Rut { return this._sellerRut; }
  public get title(): string { return this._title; }
  public get description(): string { return this._description; }
  public get startingPrice(): Money { return this._startingPrice; }
  public get currentPrice(): Money { return this._currentPrice; }
  public get reservePrice(): Money { return this._reservePrice; }
  public get minBidIncrement(): Money { return this._minBidIncrement; }
  public get status(): AuctionStatus { return this._status; }
  public get startDate(): Date { return this._startDate; }
  public get endDate(): Date { return this._endDate; }
  public get bids(): ReadonlyArray<Bid> { return [...this._bids]; }
  public get winningBid(): Bid | undefined { return this._winningBid; }
  public get domainEvents(): ReadonlyArray<IDomainEvent> { return [...this._domainEvents]; }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Activates a DRAFT auction so it can receive bids.
   */
  public activate(): Result<void> {
    if (this._status !== 'DRAFT') {
      return Result.fail<void>(`AuctionInvalidStateTransition: Cannot activate auction in status ${this._status}`);
    }
    this._status = 'ACTIVE';
    return Result.ok<void>();
  }

  /**
   * Business Logic: Places a new bid on the auction.
   * Validates state, seller vs bidder, minimum bid requirement, expiration, and creates domain events.
   */
  public placeBid(bidId: string, bidderRut: Rut, bidAmount: Money, now: Date = new Date()): Result<Bid> {
    if (this._status !== 'ACTIVE') {
      return Result.fail<Bid>(`AuctionNotActive: Bids cannot be placed on an auction in status '${this._status}'.`);
    }

    if (now > this._endDate) {
      this._status = 'CLOSED';
      return Result.fail<Bid>("AuctionExpired: This auction has already reached its end date.");
    }

    if (now < this._startDate) {
      return Result.fail<Bid>("AuctionNotStarted: Bids cannot be placed before auction start date.");
    }

    if (this._sellerRut.equals(bidderRut)) {
      return Result.fail<Bid>("AuctionSellerCannotBid: Seller cannot place bids on their own auction lot.");
    }

    // Minimum required bid amount calculation: currentPrice + minBidIncrement (unless it's the very first bid equals startingPrice)
    const requiredMinAmount = this._bids.length === 0
      ? this._startingPrice
      : this._currentPrice.add(this._minBidIncrement);

    if (bidAmount.isLessThan(requiredMinAmount)) {
      return Result.fail<Bid>(
        `BidAmountTooLow: Minimum bid required is ${requiredMinAmount.format()} (current price ${this._currentPrice.format()} + step ${this._minBidIncrement.format()}).`
      );
    }

    const newBid: Bid = {
      id: bidId,
      auctionId: this._id,
      bidderRut,
      amount: bidAmount,
      placedAt: now,
    };

    this._bids.push(newBid);
    this._currentPrice = bidAmount;
    this._winningBid = newBid;

    // Register Domain Event for Outbox Pattern
    const payload: BidPlacedPayload = {
      auctionId: this._id,
      bidderRut: bidderRut.formatted,
      bidAmount: bidAmount.value,
      bidId: newBid.id,
      placedAt: now.toISOString(),
    };

    this._domainEvents.push({
      eventId: `evt-bid-${bidId}`,
      eventName: 'BidPlaced',
      aggregateId: this._id,
      occurredOn: now,
      payload,
    });

    return Result.ok<Bid>(newBid);
  }

  /**
   * Business Logic: Closes the auction and assigns the winner if reserve price met.
   */
  public closeAuction(now: Date = new Date()): Result<void> {
    if (this._status === 'CLOSED' || this._status === 'CANCELLED') {
      return Result.fail<void>(`AuctionAlreadyFinalized: Cannot close auction already in ${this._status} status.`);
    }

    this._status = 'CLOSED';

    if (this._winningBid && this._winningBid.amount.isGreaterThanOrEqual(this._reservePrice)) {
      const payload: AuctionWonPayload = {
        auctionId: this._id,
        winnerRut: this._winningBid.bidderRut.formatted,
        winningBidAmount: this._winningBid.amount.value,
        closedAt: now.toISOString(),
      };

      this._domainEvents.push({
        eventId: `evt-won-${this._id}`,
        eventName: 'AuctionWon',
        aggregateId: this._id,
        occurredOn: now,
        payload,
      });
    }

    return Result.ok<void>();
  }
}
