import { Result } from '@/core/shared/Result';
import { AppError } from '@/core/shared/AppError';

/**
 * Domain-specific AI Agent interfaces to ensure the Core remains 
 * agnostic of external SDKs, providers, and delivery mechanisms.
 */

export interface IAgent<T = unknown, R = unknown> {
  name: string;
  execute(input: T): Promise<Result<R, AppError>>;
}

export interface IMarketingAgent extends IAgent<unknown, unknown> {}

export interface IPricingOracleAgent extends IAgent<unknown, unknown> {}

export interface ISLAGuardianAgent extends IAgent<unknown, unknown> {}

export interface INegotiatorAgent extends IAgent<unknown, unknown> {
  negotiate(quotation: unknown, provider: unknown): Promise<Result<unknown, AppError>>;
}

export interface IQualityAssuranceAgent extends IAgent<unknown, unknown> {
  evaluateQuality(delivery: unknown): Promise<Result<unknown, AppError>>;
}
