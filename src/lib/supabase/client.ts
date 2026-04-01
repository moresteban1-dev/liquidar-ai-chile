import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createBrowserClient, isBrowserClient } from '@supabase/ssr'

import { env } from '@/config/env';

/**
 * Creates a Supabase client for use in Client Components (browser).
 * Uses public anon key - safe to expose to client.
 */
export const createClient = () => {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        logger.error('CRITICAL: Supabase Environment Variables missing!');
        return createFallbackClient();
    }

    try {
        return createBrowserClient(url, key);
    } catch (error) {
        logger.error('Error creating Supabase client:', error);
        return createFallbackClient();
    }
};

function createFallbackClient() {
    logger.warn('Using fallback mock Supabase client');
    return {
        auth: {
            getUser: async () => ({ data: { user: null }, error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
                logger.warn('Fallback: signInWithPassword called with', email);
                return { data: { user: null, session: null }, error: new Error('Auth not configured') };
            },
            signInWithOAuth: async () => ({ data: { session: null }, error: new Error('OAuth not configured') }),
            signOut: async () => ({ error: null }),
            updateUser: async () => ({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: null, error: null }),
                    maybeSingle: async () => ({ data: null, error: null }),
                }),
            }),
            insert: async () => ({ error: null }),
            update: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        }),
        channel: () => ({
            on: () => ({ subscribe: () => {} }),
        }),
    };
}
