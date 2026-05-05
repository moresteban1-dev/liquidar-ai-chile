import Redis from 'ioredis';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

// ============================================================
// Redis Client — Lazy Initialization + Graceful Degradation
// 
// DESIGN DECISION: Redis is OPTIONAL infrastructure.
// The platform MUST function without it, using in-memory fallbacks.
// This prevents a dead Redis instance from cascading failures
// across the entire application (rate-limiter, queues, email).
// ============================================================

const MAX_RETRY_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY_MS = 200;
const MAX_RETRY_DELAY_MS = 3000;

/** Prevent multiple instances in development (hot reload) */
const globalForRedis = global as unknown as { redis: Redis | undefined; redisInitialized: boolean };

/**
 * Parses and sanitizes the REDIS_URL environment variable.
 * Handles common copy-paste issues (spaces, CLI flags, URL encoding).
 */
function sanitizeRedisUrl(rawUrl: string): string {
    let connectionString = rawUrl.trim();

    try {
        connectionString = decodeURIComponent(connectionString);
    } catch {
        // Fallback if decoding fails — use raw string
    }

    // Extract the actual redis:// or rediss:// URL, discarding CLI noise
    const redisUrlMatch = connectionString.match(/(rediss?:\/\/[^\s"' ]+)/);
    if (redisUrlMatch?.[1]) {
        return redisUrlMatch[1];
    }

    return connectionString;
}

/**
 * Creates a new Redis client with bounded retries and graceful error handling.
 * Returns `undefined` if REDIS_URL is not configured — this is expected behavior.
 */
export function createRedisClient(): Redis | undefined {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        logger.info('[Redis] REDIS_URL not configured — running without Redis (in-memory fallbacks active)');
        return undefined;
    }

    // Guard: Don't attempt connection during static page generation (next build)
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        logger.info('[Redis] Skipping connection during build phase');
        return undefined;
    }

    const connectionString = sanitizeRedisUrl(redisUrl);
    let failedAttempts = 0;

    const client = new Redis(connectionString, {
        maxRetriesPerRequest: null, // Required for BullMQ compatibility
        retryStrategy(times: number) {
            failedAttempts = times;

            if (times > MAX_RETRY_ATTEMPTS) {
                logger.error(`[Redis] Max retries (${MAX_RETRY_ATTEMPTS}) exceeded — giving up. Platform will use in-memory fallbacks.`);
                return null; // Stop retrying — ioredis will emit 'end' event
            }

            const delay = Math.min(times * INITIAL_RETRY_DELAY_MS, MAX_RETRY_DELAY_MS);
            logger.warn(`[Redis] Retry ${times}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`);
            return delay;
        },
        lazyConnect: true, // Don't connect immediately — wait for first command
    });

    client.on('error', (err: Error) => {
        // Only log on first error to avoid flood — subsequent errors are tracked by retryStrategy
        if (failedAttempts <= 1) {
            logger.error('[Redis] Connection Error', err);
        }
    });

    client.on('connect', () => {
        failedAttempts = 0;
        logger.info('[Redis] Connected successfully');
    });

    client.on('end', () => {
        logger.warn('[Redis] Connection closed permanently — features degraded to in-memory mode');
    });

    // Attempt initial connection (non-blocking)
    client.connect().catch((err: Error) => {
        logger.error('[Redis] Initial connection failed — platform continues with in-memory fallbacks', err);
    });

    return client;
}

/**
 * Lazy singleton accessor for the Redis client.
 * Returns `undefined` when Redis is unavailable — callers MUST handle this case.
 */
export function getRedis(): Redis | undefined {
    if (globalForRedis.redisInitialized) {
        return globalForRedis.redis;
    }

    globalForRedis.redis = createRedisClient();
    globalForRedis.redisInitialized = true;

    return globalForRedis.redis;
}

/**
 * @deprecated Use `getRedis()` instead. This export is maintained for backward compatibility
 * but will be lazily initialized on first access via a getter.
 */
export const redis = getRedis();
