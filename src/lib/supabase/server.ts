import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * createClient
 * 
 * Factory for creating a Supabase client in Next.js Server Side contexts
 * (Route Handlers, Server Actions, Server Components).
 */
const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDI2MDAsImV4cCI6MjA1Njc3ODYwMH0.1D-_u16f3M0eZl0FshgK3t_-f7YQ2Gg9Z6c0oY9LwX8';

export async function createClient() {
  const cookieStore = await cookies();
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // This can be ignored if called from a Server Component 
            // where cookies cannot be set
          }
        },
      },
    }
  );
}
