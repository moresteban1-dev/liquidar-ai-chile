/**
 * Domain-specific AI Agent interfaces to ensure the Core remains 
 * agnostic of external SDKs, providers, and delivery mechanisms.
 */

export interface IMarketingAgent {
  execute(input: any): Promise<any>;
}

export interface IPricingOracleAgent {
  execute(input: any): Promise<any>;
}

export interface ISLAGuardianAgent {
  execute(input: any): Promise<any>;
}
