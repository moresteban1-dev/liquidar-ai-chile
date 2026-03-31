'use server';

import { logger } from '@/infrastructure/telemetry/StructuredLogger';
import { createClient } from '@/lib/supabase/server';
import { quoteSchema, QuoteFormValues } from '@/lib/validators/quote-schema';
import { revalidatePath } from 'next/cache';
import { SupabaseQuoteSessionRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseQuoteSessionRepository';
import { QuoteSession } from '@/core/domain/quote/QuoteTypes';

export type SubmitQuoteResult =
    | { success: true; quoteId: string }
    | { success: false; error: string; errors?: Record<string, string[]> };

export async function submitQuoteAction(data: QuoteFormValues): Promise<SubmitQuoteResult> {
    const supabase = await createClient();
    const repo = new SupabaseQuoteSessionRepository(supabase);

    // 1. Validaciones del Servidor
    const validatedFields = quoteSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            success: false,
            error: "Datos inválidos",
            errors: validatedFields.error.flatten().fieldErrors
        };
    }

    const {
        clientName, clientRut, clientEmail, clientPhone,
        serviceId, eventDate, comments, needsTechnicalVisit,
        venueAddress, mountingTime, eventStartTime, eventEndTime, dismountingTime
    } = validatedFields.data;

    try {
        // 2. Sanitización preventiva (Senior Engineer Best Practice)
        const sanitizedComments = comments?.replace(/<[^>]*>?/gm, '').trim();
        const sanitizedClientName = clientName.replace(/[^a-zA-Z\s]/g, '').trim();

        // 3. Mapeo a Estructura de Dominio V2 (QuoteSession)
        const quoteSession: QuoteSession = {
            segment: 'CORPORATIVO', // Default segment para el wizard simplificado
            eventType: 'Standard Event',
            eventDate: eventDate,
            location: venueAddress || 'Not specified',
            attendees: 0,
            duration: 'Flexible',
            budget: 0,
            priorities: [],
            isSustainable: false,
            needsPermits: needsTechnicalVisit ? 'YES' : 'NO',
            stepData: {
                mountingTime, 
                eventStartTime, 
                eventEndTime, 
                dismountingTime,
                serviceId,
                comments: sanitizedComments
            },
            clientData: {
                name: sanitizedClientName,
                email: clientEmail,
                phone: clientPhone,
                company: clientRut, // Usando RUT como identificador de empresa si aplica
                preferences: []
            },
            status: 'DRAFT'
        };

        // 4. Persistencia en la capa V2
        const result = await repo.save(quoteSession);

        if (result.isFailure()) {
            logger.error("Supabase Repository Error:", result.getError());
            return { success: false, error: "Error al registrar su solicitud" };
        }

        revalidatePath('/admin/leads');
        return { success: true, quoteId: result.getValue() };

    } catch (error) {
        logger.error("Submit Action Error:", error);
        return { success: false, error: "Error interno del servidor" };
    }
}
