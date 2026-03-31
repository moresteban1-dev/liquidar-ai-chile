/**
 * Business Configuration Rules
 * 
 * Centralizing all margins and business constraints to avoid 
 * hardcoded logic in services and AI agents.
 */

export const BUSINESS_CONFIG = {
    PRICING: {
        DEFAULT_MARKUP_PERCENTAGE: 30, // 30% default markup
        MIN_MARKUP_PERCENTAGE: 5,
        MAX_MARKUP_PERCENTAGE: 200,
        CURRENCY: 'CLP',
    },
    AI_BROKER: {
        CONFIDENCE_THRESHOLD_AUTO_ASSIGN: 0.85, // 85% score for matching
        MAX_RETRIES: 3,
        MODEL: 'gpt-4o-mini',
    },
    QUOTATION: {
        EXPIRATION_DAYS: 7,
    }
} as const;
