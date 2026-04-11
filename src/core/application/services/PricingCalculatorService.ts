import { PlatformConfigRepository } from '../ports/PlatformConfigRepository';
import { PricingOracleAgent } from '@infrastructure/ai/agents/PricingOracleAgent';
import { Result, ok, fail } from '@core/shared/Result';

export interface PriceCalculationResult {
    baseCost: number;     // Reference/Net cost
    marginPercent: number;// Percentage applied
    marginAmount: number; // Value in money of the margin
    grossValue: number;   // Value before tax (Net)
    taxPercent: number;   // e.g. 19%
    taxAmount: number;    // Tax calculated upon gross value
    finalPrice: number;   // Total value including taxes
}

export class PricingCalculatorService {
    constructor(
        private configRepository: PlatformConfigRepository,
        private pricingAgent?: PricingOracleAgent
    ) { }

    /**
     * Dynamically calculates the full pricing breakdown for an item, taking into account
     * variable margins and global dynamic taxation.
     */
    async calculateItemPrice(
        baseCost: number,
        suggestedMarginPercent?: number | null
    ): Promise<PriceCalculationResult> {

        // 1. Fetch Global Configs dynamically
        const [taxConfig, marginConfig] = await Promise.all([
            this.configRepository.getTaxConfig(),
            this.configRepository.getMarginTiers()
        ]);

        const taxPercent = taxConfig?.percentage ?? 19; // Fallback to 19% (CL Standard)

        // 2. Determine Margin (Priority: Item Suggestion -> Global Standard -> Hardcoded Fallback)
        let marginPercent = suggestedMarginPercent;
        if (!marginPercent) {
            marginPercent = marginConfig?.standard ?? 25;
        }

        // 3. Compute Engine
        const marginAmount = Math.round(baseCost * (marginPercent / 100));
        const grossValue = baseCost + marginAmount;
        const taxAmount = Math.round(grossValue * (taxPercent / 100));
        const finalPrice = grossValue + taxAmount;

        return {
            baseCost,
            marginPercent,
            marginAmount,
            grossValue,
            taxPercent,
            taxAmount,
            finalPrice
        };
    }

    /**
     * AI-Powered: Predicts the optimal price based on historical data.
     * Implements the "Confidence Corridor" rule.
     */
    async predictOptimalPrice(
        serviceId: string,
        historicalCosts: number[],
        historicalPrices: number[],
        complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
    ): Promise<Result<any, string>> {
        if (!this.pricingAgent) {
            return fail('Pricing Agent no configurado');
        }

        try {
            const result = await this.pricingAgent.execute({
                serviceId,
                historicalCosts,
                historicalPrices,
                complexity
            });

            if (result.isFailure()) {
              return fail(result.getError().message);
            }

            return ok(result.getValue());
        } catch (error) {
            return fail(`Error al predecir precio: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
