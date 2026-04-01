import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * createClient
 * 
 * Factory for creating a Supabase client in Next.js Server Side contexts
 * (Route Handlers, Server Actions, Server Components).
 */
export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
