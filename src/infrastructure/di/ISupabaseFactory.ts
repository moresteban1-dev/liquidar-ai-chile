import { SupabaseClient } from '@supabase/supabase-js';

export interface ISupabaseFactory {
  getAdminClient(): SupabaseClient;
  getServerClient(): SupabaseClient;
  getPublicClient(): SupabaseClient;
}
