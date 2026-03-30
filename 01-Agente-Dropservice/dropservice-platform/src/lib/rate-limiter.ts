import { logger } from '@infrastructure/telemetry/StructuredLogger';

// ─── Rate Limiter Implementation ───

// Fallback In-Memory Store
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate Limit Check
 * @param key Identifier (IP, UserID)
 * @param maxRequests Max requests allowed in window
 * @param windowMs Window size in milliseconds
 * @returns true if allowed, false if blocked
 */
export async function rateLimit(
    key: string,
    maxRequests: number = 10,
    windowMs: number = 60_000
): Promise<boolean> {

    // 1. Try Redis (Distributed) - Dynamic Import for Edge Safety
    // Ensure we are strictly in Node.js and have a REDIS_URL
    if (process.env.REDIS_URL && (process.env.NEXT_RUNTIME === 'nodejs' || !process.env.NEXT_RUNTIME)) {
        try {
            // Dynamic import to avoid bundling ioredis in Edge Middleware
            const { redis } = await import('@infrastructure/redis/client');

            if (redis) {
                const redisKey = `rate_limit:${key}`;
                const current = await redis.incr(redisKey);

                if (current === 1) {
                    await redis.pexpire(redisKey, windowMs);
                }

                return current <= maxRequests;
            }
        } catch (error) {
            logger.error('[RateLimiter] Redis failed or not available', error);
            // Fallback to memory
        }
    }

    // 2. Fallback: In-Memory
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || now > entry.resetTime) {
        memoryStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return true;
    }

    if (entry.count >= maxRequests) {
        return false;
    }

    entry.count++;
    return true;
}

// Periodic cleanup for memory store (to prevent leaks)
if (typeof setInterval !== 'undefined') {
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of memoryStore) {
            if (now > entry.resetTime) {
                memoryStore.delete(key);
            }
        }
    }, 60_000);

    if (cleanupInterval.unref) {
        cleanupInterval.unref();
    }
}
