'use server';

import { createClient } from '@/lib/supabase/server';
import { SupabaseQuoteSessionRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseQuoteSessionRepository';
import { revalidatePath } from 'next/cache';

/**
 * Recupera todos los leads (QuoteSessions) para el panel de administración.
 */
export async function fetchAdminLeadsAction() {
  try {
    const supabase = await createClient();
    const repo = new SupabaseQuoteSessionRepository(supabase);
    
    const result = await repo.listAll();
    
    if (result.isFailure()) {
      return { success: false, error: result.getError() };
    }
    
    return { 
      success: true, 
      leads: JSON.parse(JSON.stringify(result.getValue())) 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza el estado de un lead.
 */
export async function updateLeadStatusAction(id: string, status: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('v2_quote_sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/admin/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
