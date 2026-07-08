'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';
import { SupabaseQuoteSessionRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseQuoteSessionRepository';
import { revalidatePath } from 'next/cache';
import { logger } from '@/infrastructure/telemetry/StructuredLogger';
import { z } from 'zod';

const LeadStatusSchema = z.enum([
  'NEW', 'CONTACTED', 'IN_PROGRESS', 'QUALIFIED', 'CONVERTED', 'LOST', 'ARCHIVED'
]);

const UpdateLeadStatusSchema = z.object({
  id: z.string().uuid('ID de lead inválido'),
  status: LeadStatusSchema,
});

/**
 * Recupera todos los leads (QuoteSessions) para el panel de administración.
 */
export async function fetchAdminLeadsAction() {
  try {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: 'No autorizado' };
    }

    const supabase = await createClient();
    const repo = new SupabaseQuoteSessionRepository(supabase);
    
    const result = await repo.listAll();
    
    if (result.isFailure()) {
      logger.error('Error fetching admin leads:', result.getError());
      return { success: false, error: 'Error al recuperar los leads' };
    }
    
    return { 
      success: true, 
      leads: JSON.parse(JSON.stringify(result.getValue())) 
    };
  } catch (error: unknown) {
    logger.error('Unexpected error in fetchAdminLeadsAction:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Actualiza el estado de un lead.
 */
export async function updateLeadStatusAction(id: string, status: string) {
  try {
    // Validate input at system boundary
    const parsed = UpdateLeadStatusSchema.safeParse({ id, status });
    if (!parsed.success) {
      return { success: false, error: `Datos inválidos: ${parsed.error.issues[0]?.message}` };
    }

    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: 'No autorizado' };
    }

    const supabase = await createClient();
    
    const { error } = await supabase
      .from('v2_quote_sessions')
      .update({ 
        status: parsed.data.status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', parsed.data.id);

    if (error) {
      logger.error('Supabase error updating lead status:', error);
      return { success: false, error: 'Error al actualizar el estado' };
    }

    revalidatePath('/admin/leads');
    return { success: true };
  } catch (error: unknown) {
    logger.error('Unexpected error in updateLeadStatusAction:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}
