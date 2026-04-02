import { NextResponse, NextRequest } from 'next/server';

/**
 * Rate Limiter — Identity Fortress
 * 
 * Multi-layer protection against Brute Force & DoS.
 * Supports both Object and Positional signatures for maximum compatibility.
 */

// ============================================
// TYPES
// ============================================

export interface RateLimitConfig {
    identifier: string;
    action: string;
    maxAttempts: number;
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

// ============================================
// CONFIGURATION
// ============================================

export const RATE_LIMITS = {
    login: {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
    },
    register: {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000,
    },
    passwordReset: {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000,
    },
    admin: {
        maxAttempts: 60,
        windowMs: 60 * 1000,
    },
    provider: {
        maxAttempts: 30,
        windowMs: 60 * 1000,
    },
    client: {
        maxAttempts: 20,
        windowMs: 60 * 1000,
    },
} as const;

// ============================================
// OVERLOAD SIGNATURES
// ============================================

export async function rateLimit(config: RateLimitConfig): Promise<RateLimitResult>;
export async function rateLimit(
    identifier: string,
    action: string,
    maxAttempts: number,
    windowMs: number
): Promise<RateLimitResult>;

// ============================================
// IMPLEMENTATION
// ============================================

export async function rateLimit(
    configOrIdentifier: RateLimitConfig | string,
    action?: string,
    maxAttempts?: number,
    windowMs?: number
): Promise<RateLimitResult> {
    
    const config: RateLimitConfig = 
        typeof configOrIdentifier === 'object'
            ? configOrIdentifier
            : {
                identifier: configOrIdentifier,
                action: action!,
                maxAttempts: maxAttempts!,
                windowMs: windowMs!
            };

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        return rateLimitRedis(config);
    }

    return rateLimitMemory(config);
}

// ============================================
// WRAPPERS
// ============================================

/**
 * High-level utility for Route Handlers.
 * Returns a 429 NextResponse if limited, or null if allowed.
 */
export async function withRateLimit(
    req: Request | NextRequest,
    actionName: string,
    options: { limit?: number; windowMs?: number } = {}
): Promise<NextResponse | null> {
    const nextReq = req instanceof NextRequest ? req : new NextRequest(req.url, { headers: req.headers });
    const ip = getClientIp(nextReq);
    
    const maxAttempts = options.limit || RATE_LIMITS.client.maxAttempts;
    const windowMs = options.windowMs || RATE_LIMITS.client.windowMs;

    const result = await rateLimit({
        identifier: ip,
        action: actionName,
        maxAttempts,
        windowMs
    });

    if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        
        return new NextResponse(
            JSON.stringify({ 
                error: 'Too Many Requests', 
                message: 'Por favor reintenta más tarde.',
                retryAfter 
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': String(maxAttempts),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(result.resetAt),
                    'Retry-After': String(retryAfter),
                }
            }
        );
    }

    return null;
}

// ============================================
// HELPERS
// ============================================

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        (req as any).ip ||
        'unknown'
    );
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

async function rateLimitMemory(config: RateLimitConfig): Promise<RateLimitResult> {
    const key = `${config.action}:${config.identifier}`;
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || now > entry.resetAt) {
        memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
        return { 
            allowed: true, 
            remaining: config.maxAttempts - 1, 
            resetAt: now + config.windowMs 
        };
    }

    entry.count++;
    return {
        allowed: entry.count <= config.maxAttempts,
        remaining: Math.max(0, config.maxAttempts - entry.count),
        resetAt: entry.resetAt,
    };
}

async function rateLimitRedis(config: RateLimitConfig): Promise<RateLimitResult> {
    try {
        const { Ratelimit } = await import('@upstash/ratelimit');
        const { Redis } = await import('@upstash/redis');

        const ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(config.maxAttempts, `${config.windowMs} ms`),
            prefix: `ratelimit:${config.action}`,
        });

        const result = await ratelimit.limit(config.identifier);

        return {
            allowed: result.success,
            remaining: result.remaining,
            resetAt: result.reset,
        };
    } catch (error) {
        console.error('[RateLimit] Redis error, falling back to memory:', error);
        return rateLimitMemory(config);
    }
}
