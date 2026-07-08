'use server';

import { createClient } from '@/lib/supabase/server';
import { SupabaseKnowledgeRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseKnowledgeRepository';

export async function getEventTypesAction() {
  try {
    const supabase = await createClient();
    const repository = new SupabaseKnowledgeRepository(supabase);
    
    const result = await repository.findAllEventTypes();
    if (result.isFailure()) {
      return { success: false, message: result.getError().message };
    }

    const eventTypes = result.getValue();
    
    return {
      success: true,
      data: eventTypes.map(et => ({
        id: et.id,
        name: et.name,
        code: et.code,
        description: et.description
      }))
    };
  } catch (error: unknown) {
    console.error('Error in getEventTypesAction:', error);
    return { success: false, message: (error instanceof Error ? error.message : String(error)) || 'Error al obtener tipos de eventos.' };
  }
}
