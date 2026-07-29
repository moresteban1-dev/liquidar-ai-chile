'use server';

import { PlaceBidUseCase, PlaceBidResponseDTO } from '../../../application/use-cases/PlaceBidUseCase';
import { IAuctionRepository } from '../../../domain/ports/IAuctionRepository';
import { IQASentinelAgent } from '../../../domain/ports/IQASentinelAgent';
import { IEventPublisher } from '../../../domain/ports/IEventPublisher';
import { Result } from '../../../domain/shared/Result';

export interface PlaceBidActionInput {
  auctionId: string;
  bidderRut: string;
  amountCLP: number;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Next.js 16 Server Action (Presentation Controller).
 * Validates input, wires infrastructure ports, and delegates execution to PlaceBidUseCase.
 */
export async function placeBidAction(
  input: PlaceBidActionInput,
  deps: {
    auctionRepository: IAuctionRepository;
    qaSentinelAgent: IQASentinelAgent;
    eventPublisher: IEventPublisher;
  }
): Promise<ActionResult<PlaceBidResponseDTO>> {
  try {
    // 1. Basic validation
    if (!input || typeof input !== 'object') {
      return { success: false, error: 'InvalidInput: Action payload must be an object.' };
    }
    if (!input.auctionId || typeof input.auctionId !== 'string') {
      return { success: false, error: 'InvalidAuctionId: Auction ID string is required.' };
    }
    if (!input.bidderRut || typeof input.bidderRut !== 'string') {
      return { success: false, error: 'InvalidBidderRut: Bidder RUT string is required.' };
    }
    if (typeof input.amountCLP !== 'number' || isNaN(input.amountCLP) || input.amountCLP <= 0) {
      return { success: false, error: 'InvalidBidAmount: Bid amount must be a positive number in CLP.' };
    }

    // 2. Instantiate Use Case with injected ports
    const useCase = new PlaceBidUseCase(
      deps.auctionRepository,
      deps.qaSentinelAgent,
      deps.eventPublisher
    );

    // 3. Execute application use case
    const result: Result<PlaceBidResponseDTO> = await useCase.execute({
      auctionId: input.auctionId,
      bidderRut: input.bidderRut,
      amountCLP: input.amountCLP,
    });

    // 4. Map Result to presentation ActionResult DTO
    if (result.isFailure) {
      return {
        success: false,
        error: result.getError(),
      };
    }

    return {
      success: true,
      data: result.getValue(),
    };
  } catch (err) {
    return {
      success: false,
      error: `UnexpectedServerError: ${(err as Error).message}`,
    };
  }
}
