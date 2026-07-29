import { Result } from '../shared/Result';
import { Money } from '../value-objects/Money';

export interface QABidEvaluationRequest {
  auctionId: string;
  bidderRut: string;
  proposedAmount: Money;
  auctionTitle: string;
  currentPrice: Money;
}

export interface QABidEvaluationResult {
  isApproved: boolean;
  riskScore: number; // 0 to 100
  reason?: string;
  flaggedForFraud: boolean;
}

/**
 * Domain Port for the QASentinelAgent AI Service.
 * Evaluates bids and auction lots for anomaly detection, fraud, and risk control.
 * Pure Domain Port: zero dependencies on Vercel AI SDK or Genkit AI.
 */
export interface IQASentinelAgent {
  evaluateBid(request: QABidEvaluationRequest): Promise<Result<QABidEvaluationResult>>;
}
