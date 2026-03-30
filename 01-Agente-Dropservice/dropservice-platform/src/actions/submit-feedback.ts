/**
 * Submit Feedback Action — Persists client feedback for a completed event.
 *
 * Validates ownership, prevents duplicates, and stores multi-dimension ratings.
 */
'use server';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClient, getAuthUser } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FeedbackInput {
    quotationId: string;
    overallRating: number;
    qualityRating?: number;
    punctualityRating?: number;
    communicationRating?: number;
    comment?: string;
    wouldRecommend?: boolean;
}

interface FeedbackResult {
    success: boolean;
    error?: string;
}

// ─── Validation ─────────────────────────────────────────────────────────────

function isValidRating(v: number | undefined): boolean {
    return v === undefined || (Number.isInteger(v) && v >= 1 && v <= 5);
}

// ─── Action ─────────────────────────────────────────────────────────────────

export async function submitFeedbackAction(input: FeedbackInput): Promise<FeedbackResult> {
    try {
        const userRes = await getAuthUser();
        if (userRes.isFailure()) {
            return { success: false, error: 'No autorizado' };
        }

        const user = userRes.getValue();
        if (user.role !== UserRole.CLIENT) {
            return { success: false, error: 'No autorizado' };
        }

        // Validate ratings
        if (!input.overallRating || input.overallRating < 1 || input.overallRating > 5) {
            return { success: false, error: 'Calificación general requerida (1-5)' };
        }
        if (!isValidRating(input.qualityRating) || !isValidRating(input.punctualityRating) || !isValidRating(input.communicationRating)) {
            return { success: false, error: 'Calificaciones deben estar entre 1 y 5' };
        }

        const supabase = createServiceRoleClient();

        // Verify quotation belongs to user and is completed
        const { data: quotation } = await supabase
            .from('quotations')
            .select('id, status')
            .eq('id', input.quotationId)
            .eq('client_id', user.id)
            .single();

        if (!quotation) {
            return { success: false, error: 'Cotización no encontrada' };
        }

        if (!['COMPLETED', 'FULFILLED', 'PAID'].includes(quotation.status)) {
            return { success: false, error: 'Solo puedes evaluar eventos completados' };
        }

        // Check for duplicate
        const { data: existing } = await supabase
            .from('client_feedback')
            .select('id')
            .eq('user_id', user.id)
            .eq('quotation_id', input.quotationId)
            .maybeSingle();

        if (existing) {
            return { success: false, error: 'Ya evaluaste este evento' };
        }

        // Insert feedback
        const { error: insertError } = await supabase
            .from('client_feedback')
            .insert({
                user_id: user.id,
                quotation_id: input.quotationId,
                overall_rating: input.overallRating,
                quality_rating: input.qualityRating ?? null,
                punctuality_rating: input.punctualityRating ?? null,
                communication_rating: input.communicationRating ?? null,
                comment: input.comment?.trim() || null,
                would_recommend: input.wouldRecommend ?? true,
            });

        if (insertError) {
            logger.error('[Feedback] Insert error:', insertError);
            return { success: false, error: 'Error al guardar tu evaluación' };
        }

        return { success: true };
    } catch (error) {
        logger.error('[Feedback] Unexpected error:', error);
        return { success: false, error: 'Error inesperado' };
    }
}
