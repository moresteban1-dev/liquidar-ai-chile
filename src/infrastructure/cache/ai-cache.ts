
// infrastructure/cache/ai-cache.ts
// ─── Caché de respuestas de IA con hash del contenido ───
import { createHash } from 'crypto';

interface CacheEntry<T> {
    data: T;
    createdAt: number;
    ttl: number;
    hits: number;
}

class AIResponseCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private readonly maxSize: number;

    constructor(maxSize = 500) {
        this.maxSize = maxSize;
    }

    private generateKey(params: Record<string, unknown>): string {
        const normalized = JSON.stringify(params, Object.keys(params).sort());
        return createHash('sha256').update(normalized).digest('hex');
    }

    get<T>(params: Record<string, unknown>): T | null {
        const key = this.generateKey(params);
        const entry = this.cache.get(key);

        if (!entry) return null;

        if (Date.now() - entry.createdAt > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        entry.hits++;
        return entry.data as T;
    }

    set<T>(
        params: Record<string, unknown>,
        data: T,
        ttlMs: number = 30 * 60 * 1000 // 30 min default
    ): void {
        // Evicción LRU simple si se excede el tamaño
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }

        this.cache.set(this.generateKey(params), {
            data,
            createdAt: Date.now(),
            ttl: ttlMs,
            hits: 0,
        });
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
        };
    }
}

export const aiCache = new AIResponseCache();
