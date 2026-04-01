import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createBrowserClient } from '@supabase/ssr'

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
        // Return a mock client that warns but doesn't crash the entire app render
        // This allows the error boundary or UI to handle it more gracefully
        // Return a mock client that warns but doesn't crash the entire app render
        // This allows the error boundary or UI to handle it more gracefully
        // even in the browser
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: new Error('Missing Supabase Config') }),
                getSession: async () => ({ data: { session: null }, error: new Error('Missing Supabase Config') }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Missing Supabase Config') }),
                signInWithOAuth: async () => ({ data: { user: null, session: null }, error: new Error('Missing Supabase Config') }),
                signOut: async () => ({ error: null }),
                updateUser: async () => ({ data: { user: null }, error: new Error('Missing Supabase Config') }),
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: async () => ({ data: null, error: new Error('Missing Supabase Config') }),
                        maybeSingle: async () => ({ data: null }),
                        order: () => ({}),
                    }),
                    order: () => ({}),
                    insert: async () => ({ error: new Error('Missing Config') }),
                    update: async () => ({ error: new Error('Missing Config') }),
                }),
            }),
            channel: () => ({
                on: () => ({ subscribe: () => { } }),
                subscribe: () => { },
                removeChannel: () => { },
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
    }

    return createBrowserClient(url, key);
};
