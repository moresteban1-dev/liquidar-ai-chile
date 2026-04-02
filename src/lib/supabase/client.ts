import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env';

/**
 * Creates a Supabase client for use in Client Components (browser).
 * 
 * IMPORTANT: This client must always have environment variables in production.
 * If missing, it throws a fatal error to prevent silent failures.
 * 
 * @returns {SupabaseClient} Typed Supabase Client
 */
export const createClient = (): SupabaseClient => {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        const errorMsg = 'FATAL: Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
        
        if (process.env.NODE_ENV === 'production') {
            throw new Error(errorMsg);
        }
        
        console.error(`❌ [Supabase Config Error]: ${errorMsg}`);
    }

    // This validation ensures TypeScript knows url and key are strings
    if (!url || !key) {
        // Fallback for types only, should not be reached in production due to throw
        return null as unknown as SupabaseClient;
    }

    return createBrowserClient(url, key, {
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    });
};
