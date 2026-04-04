import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export const createClient = (): SupabaseClient => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase environment variables. Check .env configuration.');
    }

    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    });
};
