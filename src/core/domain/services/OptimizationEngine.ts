import { Quotation } from '../aggregates/quotation/Quotation';
import { AppError } from '../../shared/AppError';
import { Result, ok } from '../../shared/Result';

/**
 * Domain Service: OptimizationEngine
 * 
 * Encapsulates NASA-Grade intelligence for financial optimization.
 * Orchestrates margin adjustments based on volume, category, and profitability targets.
 */
export class OptimizationEngine {
    private static readonly TARGET_MARGIN = 25; // %
    private static readonly MIN_MARGIN = 12;    // %
    private static readonly MAX_MARGIN = 45;    // %
    private static readonly VOLUME_THRESHOLD = 1000000; // CLP

    /**
     * Calculates the optimal markup percentage for a given quotation.
     */
    public static calculateOptimalMarkup(quotation: Quotation): Result<number, AppError> {
        const costMoney = quotation.totalProviderNet;
        if (!costMoney) return ok(this.TARGET_MARGIN);
        
        const cost = costMoney.amount;
        let suggestedMarkup = this.TARGET_MARGIN;

        // 1. Volume Optimization (Inertia Discount)
        if (cost > this.VOLUME_THRESHOLD) {
            // Reduce margin by 1% for every $500k over the threshold, down to MIN_MARGIN
            const excess = cost - this.VOLUME_THRESHOLD;
            const reduction = Math.floor(excess / 500000);
            suggestedMarkup = Math.max(this.MIN_MARGIN, suggestedMarkup - reduction);
        }

        // 2. High Value Optimization
        // If the cost is very low (< 50k), we can afford a higher margin
        if (cost < 50000 && cost > 0) {
            suggestedMarkup = Math.min(this.MAX_MARGIN, suggestedMarkup + 10);
        }

        // 3. Status Guard
        // We only optimize if it's in a state that allows adjustment
        // (This is a business rule, but we return the suggestion regardless)

        return ok(suggestedMarkup);
    }
}
