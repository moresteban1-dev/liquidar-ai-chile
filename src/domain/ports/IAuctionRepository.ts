import { Auction } from '../entities/Auction';
import { Result } from '../shared/Result';

/**
 * Domain Port for Auction Persistence repository.
 * Decouples domain logic from Supabase, Postgres, or memory implementations.
 */
export interface IAuctionRepository {
  findById(id: string): Promise<Result<Auction | null>>;
  save(auction: Auction): Promise<Result<void>>;
  updateBid(auction: Auction): Promise<Result<void>>;
}
