import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { ISupabaseFactory } from './ISupabaseFactory';
import { env } from '@/config/env';

export class SupabaseFactory implements ISupabaseFactory {
  private publicClient: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;

  getPublicClient(): SupabaseClient {
    if (!this.publicClient) {
      if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('[SupabaseFactory] Missing Supabase URL or Anon Key in env');
      }
      this.publicClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    }
    return this.publicClient;
  }

  getServerClient(): SupabaseClient {
    // Para simplificación, en Next.js App Router (fuera de server actions con cookies)
    // getServerClient y getPublicClient devuelven el mismo tipo de cliente base 
    // a menos que uses @supabase/ssr. Aquí mantenemos el cliente anónimo básico.
    return this.getPublicClient();
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('[SupabaseFactory] Missing Supabase URL or Service Role Key in env');
      }
      this.adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });
    }
    return this.adminClient;
  }
}
