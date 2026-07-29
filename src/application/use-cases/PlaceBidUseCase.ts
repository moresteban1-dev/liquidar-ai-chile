import { Result } from '../../domain/shared/Result';
import { Money } from '../../domain/value-objects/Money';
import { Rut } from '../../domain/value-objects/Rut';
import { IAuctionRepository } from '../../domain/ports/IAuctionRepository';
import { IQASentinelAgent } from '../../domain/ports/IQASentinelAgent';
import { IEventPublisher } from '../../domain/ports/IEventPublisher';
import { Bid } from '../../domain/entities/Auction';

export interface PlaceBidDTO {
  auctionId: string;
  bidderRut: string;
  amountCLP: number;
  bidId?: string;
}

export interface PlaceBidResponseDTO {
  bidId: string;
  auctionId: string;
  bidderRut: string;
  amountCLP: number;
  formattedAmount: string;
  placedAt: string;
}

/**
 * Application Use Case: PlaceBidUseCase
 * Coordinates real-time bidding by orchestrating Domain Aggregates, AI Sentinel evaluation,
 * Repository persistence, and Outbox Event dispatching.
 */
export class PlaceBidUseCase {
  constructor(
    private readonly auctionRepository: IAuctionRepository,
    private readonly qaSentinelAgent: IQASentinelAgent,
    private readonly eventPublisher: IEventPublisher
  ) {}

  public async execute(dto: PlaceBidDTO): Promise<Result<PlaceBidResponseDTO>> {
    // 1. Validate and construct Value Objects
    const rutResult = Rut.create(dto.bidderRut);
    if (rutResult.isFailure) {
      return Result.fail<PlaceBidResponseDTO>(`InvalidBidderRut: ${rutResult.getError()}`);
    }
    const bidderRut = rutResult.getValue();

    const moneyResult = Money.create(dto.amountCLP);
    if (moneyResult.isFailure) {
      return Result.fail<PlaceBidResponseDTO>(`InvalidBidAmount: ${moneyResult.getError()}`);
    }
    const bidAmount = moneyResult.getValue();

    if (!dto.auctionId || dto.auctionId.trim() === '') {
      return Result.fail<PlaceBidResponseDTO>("InvalidAuctionId: Auction ID is required.");
    }

    // 2. Fetch Auction aggregate from repository
    const auctionFindResult = await this.auctionRepository.findById(dto.auctionId);
    if (auctionFindResult.isFailure) {
      return Result.fail<PlaceBidResponseDTO>(`RepositoryError: ${auctionFindResult.getError()}`);
    }

    const auction = auctionFindResult.getValue();
    if (!auction) {
      return Result.fail<PlaceBidResponseDTO>(`AuctionNotFound: No active auction found with ID '${dto.auctionId}'.`);
    }

    // 3. Invoke QASentinelAgent Port to inspect bid anomaly/fraud risk
    const qaEvaluation = await this.qaSentinelAgent.evaluateBid({
      auctionId: auction.id,
      bidderRut: bidderRut.formatted,
      proposedAmount: bidAmount,
      auctionTitle: auction.title,
      currentPrice: auction.currentPrice,
    });

    if (qaEvaluation.isFailure) {
      return Result.fail<PlaceBidResponseDTO>(`QASentinelError: Unable to evaluate bid safety: ${qaEvaluation.getError()}`);
    }

    const qaResult = qaEvaluation.getValue();
    if (!qaResult.isApproved || qaResult.flaggedForFraud) {
      return Result.fail<PlaceBidResponseDTO>(
        `BidRejectedByQASentinel: Bid suspicious or rejected. Reason: ${qaResult.reason || 'Flagged for anomaly'}`
      );
    }

    // 4. Execute domain business logic inside the Aggregate Root
    const generatedBidId = dto.bidId || `bid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const placeBidResult = auction.placeBid(generatedBidId, bidderRut, bidAmount);

    if (placeBidResult.isFailure) {
      return Result.fail<PlaceBidResponseDTO>(placeBidResult.getError());
    }

    const placedBid: Bid = placeBidResult.getValue();

    // 5. Save updated Aggregate Root via Repository Port
    const saveResult = await this.auctionRepository.save(auction);
    if (saveResult.isFailure) {
      return Result.fail<PlaceBidResponseDTO>(`PersistenceFailed: ${saveResult.getError()}`);
    }

    // 6. Dispatch Outbox Domain Events via EventPublisher Port
    if (auction.domainEvents.length > 0) {
      const publishResult = await this.eventPublisher.publishBatch(auction.domainEvents);
      if (publishResult.isFailure) {
        // Log warning or store in outbox table fallback (Outbox Pattern guarantees consistency)
        console.warn(`[OutboxWarning] Failed immediate publish of domain events: ${publishResult.getError()}`);
      }
      auction.clearDomainEvents();
    }

    // 7. Return successful DTO
    return Result.ok<PlaceBidResponseDTO>({
      bidId: placedBid.id,
      auctionId: auction.id,
      bidderRut: bidderRut.formatted,
      amountCLP: bidAmount.value,
      formattedAmount: bidAmount.format(),
      placedAt: placedBid.placedAt.toISOString(),
    });
  }
}
