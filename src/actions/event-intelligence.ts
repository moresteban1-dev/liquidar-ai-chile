'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { InferenceEngine } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { SupabaseKnowledgeRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseKnowledgeRepository';
import { EventProfile, InferredNeed } from '@/core/domain/event-intelligence/types';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

import { InferenceToRFQService } from '@/core/application/services/InferenceToRFQService';
import { ProductMatcher } from '@/core/domain/event-intelligence/ProductMatcher';
import { SupabaseCatalogRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseCatalogRepository';
import { CatalogItemMapper } from '@/infrastructure/persistence/supabase/mappers/CatalogItemMapper';
import { CatalogCategoryMapper } from '@/infrastructure/persistence/supabase/mappers/CatalogCategoryMapper';
import { SupabaseQuoteSessionRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseQuoteSessionRepository';

// Scheme setup validator
const EventProfileSchema = z.object({
  eventTypeId: z.string().uuid(),
  attendees: z.number().min(1).max(50000),
  durationHours: z.number().min(1).max(720), // Up to 1 month
  venueParams: z.object({
    isOutdoor: z.boolean(),
    squareMeters: z.number().optional(),
  }).optional()
});

export type WizardState = {
  success: boolean;
  message: string;
  sessionId?: string;
  inferredGraph?: InferredNeed[];
};

export async function generateIntelligentConfiguration(
  _prevState: WizardState,
  formData: FormData
): Promise<WizardState> {
  try {
    const supabase = await createClient();

    // 1. Validar el Input
    const rawData = {
      eventTypeId: formData.get('eventTypeId') as string,
      attendees: parseInt(formData.get('attendees') as string, 10),
      durationHours: parseInt(formData.get('durationHours') as string, 10),
    };

    const parsedData = EventProfileSchema.safeParse(rawData);

    if (!parsedData.success) {
      return { success: false, message: 'Parámetros inválidos. Revisa el formulario.' };
    }

    const profile: EventProfile = {
      eventTypeId: parsedData.data.eventTypeId,
      attendees: parsedData.data.attendees,
      durationHours: parsedData.data.durationHours
    };

    // 2. Instanciar el Motor de Inferencia
    const repository = new SupabaseKnowledgeRepository(supabase);
    const engine = new InferenceEngine(repository);

    const inferenceResult = await engine.runInference(profile);

    if (inferenceResult.isFailure()) {
      return { success: false, message: `Error de inferencia: ${inferenceResult.getError().message}` };
    }

    const inferredNodes = inferenceResult.getValue();

    // 4. Guardar Sesión de Configuración (Borrador del usuario)
    const sessionId = uuidv4();
    
    await repository.saveConfigurationSession({
      id: sessionId,
      clientId: null,
      baseProfile: profile,
      inferredGraph: inferredNodes,
      status: 'IN_PROGRESS',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    revalidatePath('/wizard');

    return {
      success: true,
      message: 'Configuración generada con éxito basándose en la topología funcional.',
      sessionId: sessionId,
      inferredGraph: inferredNodes
    };

  } catch (error: any) {
    console.error('Error generando configuración:', error);
    return { success: false, message: error.message || 'Error interno del motor de inferencia.' };
  }
}

export async function requestQuotationAction(
  sessionId: string,
  clientData: { 
    name: string; 
    email: string; 
    phone: string; 
    company?: string;
    segment?: any; 
  }
): Promise<WizardState> {
  try {
    const supabase = await createClient();

    // 1. Instanciar dependencias para el orquestador
    const configRepo = new SupabaseKnowledgeRepository(supabase);
    const engine = new InferenceEngine(configRepo);
    
    const catalogRepo = new SupabaseCatalogRepository(
      supabase,
      new CatalogItemMapper(),
      new CatalogCategoryMapper()
    );
    const matcher = new ProductMatcher(catalogRepo);
    
    const quoteRepo = new SupabaseQuoteSessionRepository(supabase);

    // Logger needs to be injected into InferenceToRFQService
    const { StructuredLogger } = await import('@/infrastructure/telemetry/StructuredLogger');
    const logger = StructuredLogger.create({ component: 'RequestQuotationAction' });

    // 2. Ejecutar el Servicio de Conversión
    const rfqService = new InferenceToRFQService(engine, matcher, configRepo, quoteRepo, logger);
    
    const result = await rfqService.convertToRFQ(sessionId, clientData);

    if (result.isFailure()) {
      return { success: false, message: result.getError().message };
    }

    revalidatePath('/admin/quotes');

    return {
      success: true,
      message: 'Tu solicitud de cotización ha sido enviada al administrador.',
      sessionId: result.getValue()
    };

  } catch (error: any) {
    console.error('Error en requestQuotationAction:', error);
    return { success: false, message: error.message || 'Error al procesar la solicitud.' };
  }
}

