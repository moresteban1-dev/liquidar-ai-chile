/**
 * Rate Limiter Configuration
 */
export interface RateLimitConfig {
  windowMs: number;  // Time window in ms
  max: number;       // Max attempts per window
}

/**
 * Interface for distributed rate limiters
 */
export interface IRateLimiter {
  isAllowed(key: string, config: RateLimitConfig): Promise<boolean>;
  getRemaining(key: string, config: RateLimitConfig): Promise<number>;
}

/**
 * Memory-based Rate Limiter (Tier 1 Implementation)
 * Note: Not distributed across multiple instances.
 */
export class MemoryRateLimiter implements IRateLimiter {
  private static instances: Map<string, { count: number, resetAt: number }> = new Map();

  public async isAllowed(key: string, config: RateLimitConfig): Promise<boolean> {
    const now = Date.now();
    const state = MemoryRateLimiter.instances.get(key);

    if (!state || now > state.resetAt) {
      MemoryRateLimiter.instances.set(key, {
        count: 1,
        resetAt: now + config.windowMs
      });
      return true;
    }

    if (state.count >= config.max) {
      return false;
    }

    state.count++;
    return true;
  }

  public async getRemaining(key: string, config: RateLimitConfig): Promise<number> {
    const now = Date.now();
    const state = MemoryRateLimiter.instances.get(key);

    if (!state || now > state.resetAt) {
      return config.max;
    }

    return Math.max(0, config.max - state.count);
  }
}

/**
 * Rate Limiter Presets
 */
export const RATE_LIMIT_PRESETS = {
  SENSITIVE_ACTION: { windowMs: 60 * 1000, max: 5 }, // 5 calls per minute
  API_SEARCH: { windowMs: 60 * 1000, max: 60 },      // 60 calls per minute
  AUTH_ATTEMPT: { windowMs: 15 * 60 * 1000, max: 10 } // 10 calls per 15 minutes
};
