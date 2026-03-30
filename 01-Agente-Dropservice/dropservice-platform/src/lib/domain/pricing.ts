
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClient } from '@/lib/supabase/api';

/**
 * Domain Logic: Pricing Analysis
 * Handles interactions with historical pricing data.
 */

/**
 * Fetches historical accepted quotations for a specific service category.
 * Uses Service Role to access all data for aggregation.
 * 
 * @param category Service category (e.g., 'web-dev', 'seo')
 * @returns Average price or null if no data
 */
export async function getHistoricalPricing(category: string): Promise<number> {
    const supabase = createServiceRoleClient();

    // We want 'ACCEPTED' or 'COMPLETED' quotations/orders
    // Assuming 'quotations' table has 'status', 'amount', and 'service_category' (or linked service)
    // Adjusting query based on standard Supabase structure for this project

    const { data, error } = await supabase
        .from('quotations')
        .select('amount')
        .eq('service_category', category)
        .in('status', ['ACCEPTED', 'COMPLETED', 'PAID']);

    if (error) {
        logger.error("Error fetching historical pricing:", error);
        return 100000; // Fallback to a safe default if DB fails
    }

    if (!data || data.length === 0) {
        return 100000; // Default if no history
    }

    // Calculate Average
    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    const avg = Math.round(total / data.length);

    return avg;
}
