'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createClient } from '@/lib/supabase/server';
import { SupabasePlatformConfigRepository } from '@/infrastructure/persistence/supabase/repositories/SupabasePlatformConfigRepository';
import { SupabaseQuoteSessionRepository } from '@infrastructure/persistence/supabase/repositories/SupabaseQuoteSessionRepository';
import { VariantGeneratorService } from '@core/application/services/VariantGeneratorService';
import { QuoteSession, QuoteItemRequested, QuoteOption } from '@core/domain/quote/QuoteTypes';
import { QuoterState } from '@/components/quoter/WizardContainer';

import { ActionResponse } from '@/types/actions';

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
    } catch (error: any) {
        logger.error("Error in getDownPaymentAction:", error);
        return 30; // Fallback to 30% if DB is down or value is missing
    }
}

/**
 * Server Action to submit the complete Wizard State, infer the segment,
 * generate real Quote Options, and save everything to Supabase.
 */
export async function submitQuoteSessionAction(state: QuoterState): Promise<ActionResponse<QuoteSession>> {
    const supabase = await createClient();
    const repo = new SupabaseQuoteSessionRepository(supabase);
    const generator = new VariantGeneratorService();

    // 1. Inferir Segmento
    const segment = generator.inferSegment(state.eventType, state.leadCompany);

    // 2. Mapear items solicitados
    const requestedItems: QuoteItemRequested[] = [
        ...state.selectedServices.map(id => ({ catalogItemId: id, isCustom: false })),
        ...state.customServices.map(name => ({ isCustom: true, customName: name }))
    ];

    // 3. Crear entidad de Dominio base
    const partialSession: Partial<QuoteSession> = {
        segment,
        stepData: state,
        eventType: state.eventType,
        eventDate: state.date,
        location: state.location,
        attendees: state.attendees,
        duration: state.duration,
        budget: state.budget,
        priorities: state.priorities,
        isSustainable: state.isSustainable,
        needsPermits: state.needsPermits,
        clientData: {
            name: state.leadName,
            email: state.leadEmail,
            phone: state.leadPhone,
            company: state.leadCompany,
            preferences: state.contactPreferences
        },
        status: 'GENERATED',
        requestedItems
    };

    // 4. Generar Opciones Comerciales (Económica, Recomendada, Premium)
    const options: QuoteOption[] = generator.generateOptions(partialSession);

    // Asignar opciones a la sesión para que se graben
    partialSession.options = options;

    try {
        // 5. Grabar inmutablemente en DB (Audit log safe)
        const saveResult = await repo.save(partialSession as QuoteSession);
        
        if (saveResult.isFailure()) {
            logger.error("Error guardando sesión de cotización:", saveResult.getError());
            return { success: false, error: saveResult.getError() };
        }

        const sessionId = saveResult.getValue();

        // 6. Agregar los ítems solicitados
        const itemsResult = await repo.addItems(sessionId, requestedItems);
        if (itemsResult.isFailure()) {
            logger.error("Error agregando ítems a la sesión:", itemsResult.getError());
        }

        // Recuperar la sesión completa para devolverla (con IDs generados)
        const finalResult = await repo.findById(sessionId);
        if (finalResult.isFailure() || !finalResult.getValue()) {
            return { success: false, error: "Sesión guardada pero no se pudo recuperar." };
        }

        return { success: true, data: finalResult.getValue()! };
    } catch (error: any) {
        logger.error("Error subiendo cotización a Supabase:", error);
        return { success: false, error: error.message || "No se pudo generar y guardar la cotización." };
    }
}
