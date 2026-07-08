'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createClient } from '@/lib/supabase/server';
import { SupabasePlatformConfigRepository } from '@/infrastructure/persistence/supabase/repositories/SupabasePlatformConfigRepository';
import { SupabaseQuoteSessionRepository } from '@infrastructure/persistence/supabase/repositories/SupabaseQuoteSessionRepository';
import { VariantGeneratorService } from '@core/application/services/VariantGeneratorService';
import { QuoteSession, QuoteItemRequested, QuoteOption } from '@core/domain/quote/QuoteTypes';
import { QuoterState } from '@/components/quoter/QuoterTypes';
import { ActionResponse } from '@/types/actions';
import { z } from 'zod';

const SubmitQuoteSessionSchema = z.object({
    eventType: z.string().min(1, 'Tipo de evento requerido').max(100),
    eventSubtype: z.string().max(100).default(''),
    date: z.coerce.date().nullable(),
    isFlexibleDate: z.boolean().default(false),
    location: z.string().max(200).default(''),
    venueStatus: z.enum(['TENGO_RECINTO', 'NECESITO_RECINTO', 'POR_DEFINIR']).default('POR_DEFINIR'),
    attendees: z.number().int().min(1).max(100000).default(150),
    duration: z.enum(['4H', '8H', 'MULTIPLE']).default('8H'),
    selectedServices: z.array(z.string().uuid()).default([]),
    customServices: z.array(z.string().max(200)).max(20).default([]),
    budget: z.number().min(0).max(999999999).default(0),
    priorities: z.array(z.string().max(100)).max(10).default([]),
    isSustainable: z.boolean().default(false),
    needsPermits: z.enum(['SI_TODO', 'SOLO_ASESORIA', 'NO']).default('NO'),
    comments: z.string().max(2000).default(''),
    leadName: z.string().min(2, 'Nombre requerido').max(100).trim(),
    leadEmail: z.string().email('Email inválido').max(200).trim(),
    leadPhone: z.string().min(8, 'Teléfono inválido').max(20).trim(),
    leadCompany: z.string().max(200).trim().default(''),
    contactPreferences: z.array(z.enum(['EMAIL', 'WHATSAPP', 'PHONE'])).min(1, 'Seleccione al menos una preferencia de contacto'),
});

/**
 * Server Action to fetch the dynamic Down Payment percentage for the Quoter Wizard.
 * This ensures the frontend doesn't need direct DB access and leverages the backend Repository.
 */
export async function getDownPaymentAction(): Promise<number> {
    const supabase = await createClient();
    const configRepo = new SupabasePlatformConfigRepository(supabase);

    try {
        const pct = await configRepo.getDownPaymentPercentage();
        return pct;
    } catch (error: unknown) {
        logger.error("Error in getDownPaymentAction:", error);
        return 30; // Fallback to 30% if DB is down or value is missing
    }
}

/**
 * Server Action to submit the complete Wizard State, infer the segment,
 * generate real Quote Options, and save everything to Supabase.
 */
export async function submitQuoteSessionAction(state: QuoterState): Promise<ActionResponse<QuoteSession>> {
    // Validate input at system boundary
    const parsed = SubmitQuoteSessionSchema.safeParse(state);
    if (!parsed.success) {
        logger.warn('Invalid QuoterState submitted:', { issues: parsed.error.issues });
        return { success: false, error: `Datos inválidos: ${parsed.error.issues[0]?.message}` };
    }
    const validatedState = parsed.data;

    const supabase = await createClient();
    const repo = new SupabaseQuoteSessionRepository(supabase);
    const generator = new VariantGeneratorService();

    // 1. Inferir Segmento
    const segment = generator.inferSegment(validatedState.eventType, validatedState.leadCompany);

    // 2. Mapear items solicitados
    const requestedItems: QuoteItemRequested[] = [
        ...validatedState.selectedServices.map(id => ({ catalogItemId: id, isCustom: false })),
        ...validatedState.customServices.map(name => ({ isCustom: true, customName: name }))
    ];

    // 3. Crear entidad de Dominio base
    const partialSession: Partial<QuoteSession> = {
        segment,
        stepData: validatedState as any,
        eventType: validatedState.eventType,
        eventDate: validatedState.date,
        location: validatedState.location,
        attendees: validatedState.attendees,
        duration: validatedState.duration,
        budget: validatedState.budget,
        priorities: validatedState.priorities,
        isSustainable: validatedState.isSustainable,
        needsPermits: validatedState.needsPermits,
        clientData: {
            name: validatedState.leadName,
            email: validatedState.leadEmail,
            phone: validatedState.leadPhone,
            company: validatedState.leadCompany,
            preferences: validatedState.contactPreferences
        },
        status: 'GENERATED',
        requestedItems
    };

    // 4. Generar Opciones Comerciales (Económica, Recomendada, Premium)
    const optionsResult = generator.generateOptions(partialSession);
    if (optionsResult.isFailure()) {
        logger.error("Error generando opciones comerciales:", optionsResult.getError());
        return { success: false, error: optionsResult.getError().message };
    }
    const options = optionsResult.getValue();

    // Asignar opciones a la sesión para que se graben
    partialSession.options = options;

    try {
        // 5. Grabar inmutablemente en DB (Audit log safe)
        const saveResult = await repo.save(partialSession as QuoteSession);
        
        if (saveResult.isFailure()) {
            logger.error("Error guardando sesión de cotización:", saveResult.getError());
            return { success: false, error: `Error base de datos: ${saveResult.getError().message}` };
        }

        const sessionId = saveResult.getValue();

        // 6. Agregar los ítems solicitados (Atómico lógico)
        const itemsResult = await repo.addItems(sessionId, requestedItems);
        if (itemsResult.isFailure()) {
            logger.error("Error crítico agregando ítems a la sesión:", itemsResult.getError());
            // TODO: En el futuro podríamos disparar un rollback aquí si fuera necesario
            return { success: false, error: "No se pudieron registrar los ítems de la cotización." };
        }

        // 7. Guardar las opciones comerciales
        const saveOptionsResult = await repo.saveOptions(sessionId, options);
        if (saveOptionsResult.isFailure()) {
            logger.error("Error crítico guardando opciones para la sesión:", saveOptionsResult.getError());
            return { success: false, error: "No se pudieron registrar las opciones comerciales." };
        }

        // Recuperar la sesión completa para devolverla (con IDs generados)
        const finalResult = await repo.findById(sessionId);
        if (finalResult.isFailure() || !finalResult.getValue()) {
            return { success: false, error: "La cotización se guardó pero hubo un error de sincronización final." };
        }

        return { success: true, data: finalResult.getValue()! };
    } catch (error: unknown) {
        logger.error("Atrapado error inesperado en submitQuoteSessionAction:", error);
        return { success: false, error: "Ocurrió un error inesperado al procesar la cotización." };
    }
}
