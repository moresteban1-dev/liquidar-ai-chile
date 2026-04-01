import Redis from 'ioredis';
import { NextResponse } from 'next/server';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

// Inicialización lazy y resiliente (Fallback a memoria si falla Redis en local)
let redisClient: Redis | null = null;
const memoryCache = new Map<string, { count: number; resetTime: number }>();

try {
    if (process.env.REDIS_URL) {
        redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            retryStrategy: () => null, // No reintentar agresivamente, fallar rápido
        });

        redisClient.on('error', (err) => {
            logger.warn('⚠️ [RateLimiter] Error conectando a Redis, operando en fallback-mode.', { error: err.message });
            redisClient = null;
        });
    }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error) {
    logger.warn('⚠️ [RateLimiter] No se pudo inicializar Redis. Usando memoria local.');
}

interface RateLimitConfig {
    limit: number;     // Requests permitidas
    windowMs: number;  // Ventana de tiempo en milisegundos
}

/**
 * Enterprise Rate Limiter
 * Aplica validaciones por IP o TenantID, usando Redis.
 * Posee Fallback silencioso a Memoria para no derribar el servidor si Redis cae (Graceful Degradation).
 */
export async function rateLimit(
    identifier: string,
    config: RateLimitConfig = { limit: 10, windowMs: 60000 }
): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = Date.now();
    const resetTime = now + config.windowMs;

    if (redisClient && redisClient.status === 'ready') {
        try {
            // transaccion atómica en redis
            const current = await redisClient.incr(identifier);
            if (current === 1) {
                await redisClient.pexpire(identifier, config.windowMs);
            }
            return {
                success: current <= config.limit,
                remaining: Math.max(0, config.limit - current),
                reset: resetTime,
            };
        } catch (error) {
            logger.error('🚨 [RateLimiter] Redis falló durante la verificación. Redirigiendo a Memoria.', error);
        }
    }

    // == INMEMORY FALLBACK ==
    // En Next.js App Router (Node.js runtime), esto persiste entre requests de la misma Lambda
    const record = memoryCache.get(identifier) || { count: 0, resetTime };

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = resetTime;
    } else {
        record.count += 1;
    }

    memoryCache.set(identifier, record);

    // Limpieza agresiva de memoria para evitar OutOfMemory (OOM) 
    if (memoryCache.size > 10000) memoryCache.clear();

    return {
        success: record.count <= config.limit,
        remaining: Math.max(0, config.limit - record.count),
        reset: record.resetTime,
    };
}

/**
 * Wrapper utilitario para Route Handlers
 */
export async function withRateLimit(
    req: Request,
    actionName: string,
    config?: RateLimitConfig
) {
    // Extraer IP de headers estándar (Vercel, Cloudflare, local)
    const ip = req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        '127.0.0.1';

    const identifier = `rate-limit:${actionName}:${ip}`;
    const result = await rateLimit(identifier, config);

    if (!result.success) {
        logger.warn(`[SECURITY] 🛡️ Rate limit excedido para IP ${ip} en recurso ${actionName}`);
        return new NextResponse('Too Many Requests. Por favor reintenta más tarde.', {
            status: 429,
            headers: {
                'X-RateLimit-Limit': String(config?.limit || 10),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(result.reset),
                'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
            },
        });
    }

    return null; // Aprobado
}
