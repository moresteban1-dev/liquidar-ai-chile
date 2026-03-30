import Redis from 'ioredis';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

// Prevent multiple instances in development (hot reload)
const globalForRedis = global as unknown as { redis: Redis | undefined };

const REDIS_URL = process.env.REDIS_URL;

export const createRedisClient = () => {
    if (!REDIS_URL) {
        logger.warn('[Redis] REDIS_URL is not defined. Redis features will be disabled or fail.');
        return undefined;
    }

    // Fix: Users often copy CLI commands or have trailing spaces
    // Example: " --tls -u redis://..." or "%20--tls%20-u%20redis://..."
    let connectionString: string = REDIS_URL.trim();
    
    // Decode URL-encoded characters if present (like %20)
    try {
        connectionString = decodeURIComponent(connectionString);
    } catch (e) {
        // Fallback if decoding fails
    }

    // Extract the actual redis:// or rediss:// URL using regex
    const redisUrlMatch = connectionString.match(/(rediss?:\/\/[^\s"' ]+)/);
    if (redisUrlMatch) {
        connectionString = redisUrlMatch[1];
    }

    const client = new Redis(connectionString, {
        maxRetriesPerRequest: null, // Required for BullMQ
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    });

    client.on('error', (err) => {
        logger.error('[Redis] Connection Error', err);
    });

    client.on('connect', () => {
        logger.info('[Redis] Connected successfully');
    });

    return client;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production' && redis) {
    globalForRedis.redis = redis;
}
