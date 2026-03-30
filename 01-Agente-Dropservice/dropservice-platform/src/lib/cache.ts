import { unstable_cache } from 'next/cache';

// L3 Cache: In-memory (limited to process lifespan)
// In serverless, this persists only during the lambda execution (hot start)
const memoryCache = new Map<string, { value: unknown; expires: number }>();

export function createCachedQuery<TArgs extends unknown[], TResult>(
    queryFn: (...args: TArgs) => Promise<TResult>,
    options: {
        keyPrefix: string;
        revalidate: number; // Seconds
        tags: string[];
        memoryTTL?: number; // Seconds (default 5s)
    }
) {
    return async (...args: TArgs): Promise<TResult> => {
        // Serialize args to create unique key
        const keyParts = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        );
        const cacheKey = `${options.keyPrefix}:${keyParts.join(':')}`;

        // L3: Check Memory Cache
        const now = Date.now();
        const memEntry = memoryCache.get(cacheKey);
        if (memEntry && memEntry.expires > now) {
            return memEntry.value as TResult;
        }

        // L2: Next.js Data Cache (unstable_cache)
        const serverCachedFn = unstable_cache(
            async () => {
                const result = await queryFn(...args);

                // Populate L3 on fresh fetch
                const memoryTTL = (options.memoryTTL ?? 5) * 1000;
                memoryCache.set(cacheKey, {
                    value: result,
                    expires: now + memoryTTL
                });

                return result;
            },
            [cacheKey],
            {
                revalidate: options.revalidate,
                tags: options.tags
            }
        );

        return serverCachedFn();
    };
}
