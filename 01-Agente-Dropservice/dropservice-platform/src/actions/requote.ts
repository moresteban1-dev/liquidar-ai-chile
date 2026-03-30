/**
 * Re-quotation Action — Clones a completed quotation with new date/attendees.
 *
 * Creates a new quotation in PENDING_ASSIGNMENT status,
 * copying brief, service, location from the original.
 */
'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { getAuthUser } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RequoteInput {
    originalQuotationId: string;
    newEventDate: string;
    newAttendees: number;
}

interface RequoteResult {
    success: boolean;
    newQuotationId?: string;
    error?: string;
}

// ─── Action ─────────────────────────────────────────────────────────────────

export async function createRequoteAction(input: RequoteInput): Promise<RequoteResult> {
    try {
        // 1. Auth check
        const userRes = await getAuthUser();
        if (userRes.isFailure()) {
            return { success: false, error: 'No autorizado: ' + userRes.getError().message };
        }
        
        const user = userRes.getValue();
        if (user.role !== UserRole.CLIENT) {
            return { success: false, error: 'Solo clientes pueden re-cotizar' };
        }

        // 2. Validate input
        if (!input.originalQuotationId) {
            return { success: false, error: 'Cotización original requerida' };
        }
        if (!input.newEventDate) {
            return { success: false, error: 'Fecha del evento requerida' };
        }
        if (input.newAttendees < 1) {
            return { success: false, error: 'Número de asistentes inválido' };
        }

        const eventDate = new Date(input.newEventDate);
        if (eventDate <= new Date()) {
            return { success: false, error: 'La fecha debe ser futura' };
        }

        // 3. Fetch original quotation
        const supabase = createServiceRoleClient();
        const { data: original, error: fetchError } = await supabase
            .from('quotations')
            .select('id, client_id, service_id, brief, event_location, event_time, setup_time, teardown_time, attendees')
            .eq('id', input.originalQuotationId)
            .eq('client_id', user.id)
            .single();

        if (fetchError || !original) {
            return { success: false, error: 'Cotización original no encontrada' };
        }

        // 4. Build enriched brief
        const requoteBrief = [
            original.brief ?? '',
            '',
            `--- Re-cotización ---`,
            `Basada en: ${original.id.slice(0, 8)}`,
            `Nueva fecha: ${eventDate.toLocaleDateString('es-CL')}`,
            `Asistentes actualizados: ${input.newAttendees}`,
        ].join('\n');

        // 5. Generate sequential code
        const { data: lastQuotation } = await supabase
            .from('quotations')
            .select('code')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const lastNum = lastQuotation?.code
            ? parseInt((lastQuotation.code as string).replace('COT-', ''), 10)
            : 0;
        const newCode = `COT-${String(lastNum + 1).padStart(4, '0')}`;

        // 6. Insert new quotation
        const { data: newQuotation, error: insertError } = await supabase
            .from('quotations')
            .insert({
                client_id: user.id,
                service_id: original.service_id,
                brief: requoteBrief,
                event_location: original.event_location,
                event_start_date: input.newEventDate,
                event_time: original.event_time,
                setup_time: original.setup_time,
                teardown_time: original.teardown_time,
                attendees: input.newAttendees,
                status: 'PENDING_ASSIGNMENT',
                public_status: 'RECIBIDA',
                code: newCode,
            })
            .select('id')
            .single();

        if (insertError || !newQuotation) {
            logger.error('[Requote] Insert error:', insertError);
            return { success: false, error: 'Error al crear la nueva cotización' };
        }

        return {
            success: true,
            newQuotationId: newQuotation.id,
        };
    } catch (error) {
        logger.error('[Requote] Unexpected error:', error);
        return { success: false, error: 'Error inesperado al re-cotizar' };
    }
}
