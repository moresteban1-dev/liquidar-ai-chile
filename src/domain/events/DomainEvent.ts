/**
 * Base Interface for all Domain Events in Hexagonal DDD Architecture.
 * Domain events are immutable representations of facts that occurred in the domain.
 */
export interface IDomainEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly payload: Record<string, unknown>;
}

export interface BidPlacedPayload extends Record<string, unknown> {
  auctionId: string;
  bidderRut: string;
  bidAmount: number;
  bidId: string;
  placedAt: string;
}

export interface AuctionWonPayload extends Record<string, unknown> {
  auctionId: string;
  winnerRut: string;
  winningBidAmount: number;
  closedAt: string;
}
