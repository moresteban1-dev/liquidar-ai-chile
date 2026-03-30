'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createClient } from '@/lib/supabase/server';
import { quoteSchema, QuoteFormValues } from '@/lib/validators/quote-schema';
import { revalidatePath } from 'next/cache';

export type SubmitQuoteResult =
    | { success: true; quoteId: string }
    | { success: false; error: string; errors?: Record<string, string[]> };

export async function submitQuoteAction(data: QuoteFormValues): Promise<SubmitQuoteResult> {
    const supabase = await createClient();

    // 1. Server-side Validation
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
        // 2. Insert into Supabase
        // We're flattening the form data into the DB schema
        // Assuming quotes table has JSONB 'logistics_details' or similar columns
        // For this MVP, we map to existing columns or a flexible jsonb column

        const { data: quote, error } = await supabase
            .from('quotes')
            .insert({
                service_id: serviceId,
                client_id: '00000000-0000-0000-0000-000000000000', // Anonymous/New Client - In real app we'd create User first or link
                // For MVP we might store client details in the quote itself or assume logged in user
                // Let's assume we store these in metadata or client_details jsonb for now if columns don't exist
                status: 'PENDING_PROVIDER_ASSIGNMENT',
                total_price: 0, // Blind pricing start
                created_at: new Date().toISOString(),
                // Metadata
                description: comments,
                event_start_date: eventDate.toISOString(),
                location: venueAddress,
                // We'll store the rich logistical data in a JSONB column if specific columns don't exist
                // Or map to specific columns if we added them. 
                // Let's assume a 'details' jsonb column exists or we abuse 'description' for now.
                // ideally:
                metadata: {
                    client: { name: clientName, rut: clientRut, email: clientEmail, phone: clientPhone },
                    logistics: { mountingTime, eventStartTime, eventEndTime, dismountingTime, needsTechnicalVisit }
                }
            })
            .select()
            .single();

        if (error) {
            logger.error("Supabase Error:", error);
            return { success: false, error: "Error al guardar la cotización" };
        }

        // 3. Trigger Notification (Stub for n8n)
        // await fetch(process.env.N8N_WEBHOOK_URL, { method: 'POST', body: JSON.stringify(quote) });

        revalidatePath('/client/orders');
        return { success: true, quoteId: quote.id };

    } catch (error) {
        logger.error("Submit Action Error:", error);
        return { success: false, error: "Error interno del servidor" };
    }
}
