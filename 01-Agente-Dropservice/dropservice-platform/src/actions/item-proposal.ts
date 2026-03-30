'use server';

/**
 * submitItemProposalAction — Server Action for vendors to propose new catalog items.
 *
 * Flow: Vendor proposes → PENDING → Admin reviews → APPROVED/REJECTED
 * If approved, admin creates the catalog item and links it.
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServiceRoleClient, getAuthUser } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ItemProposalInput {
    name: string;
    description?: string;
    category: string;
    itemType: 'SERVICE' | 'EQUIPMENT' | 'PERMIT' | 'MIXED';
    estimatedCost: number;
    unitLabel: string;
}

interface ItemProposalResult {
    success: boolean;
    error?: string;
    proposalId?: string;
}

// ─── Validation ─────────────────────────────────────────────────────────────

const VALID_ITEM_TYPES = new Set(['SERVICE', 'EQUIPMENT', 'PERMIT', 'MIXED']);

function validateProposal(input: ItemProposalInput): string | null {
    if (!input.name || !input.name.trim()) {
        return 'El nombre del ítem es obligatorio';
    }
    if (input.name.trim().length < 3) {
        return 'El nombre debe tener al menos 3 caracteres';
    }
    if (!input.category || !input.category.trim()) {
        return 'La categoría es obligatoria';
    }
    if (!VALID_ITEM_TYPES.has(input.itemType)) {
        return `Tipo de ítem inválido: ${input.itemType}`;
    }
    if (typeof input.estimatedCost !== 'number' || input.estimatedCost < 0) {
        return 'El costo estimado debe ser un número positivo';
    }
    if (!input.unitLabel || !input.unitLabel.trim()) {
        return 'La unidad de medida es obligatoria';
    }
    return null;
}

// ─── Main Action ────────────────────────────────────────────────────────────

export async function submitItemProposalAction(
    input: ItemProposalInput
): Promise<ItemProposalResult> {
    try {
        // 1. Auth — verify user is a provider
        const userRes = await getAuthUser();
        if (userRes.isFailure()) {
            return { success: false, error: 'No autorizado: ' + userRes.getError().message };
        }
        
        const user = userRes.getValue();
        if (user.role !== UserRole.VENDOR) {
            return { success: false, error: 'Solo proveedores pueden proponer ítems' };
        }

        // 2. Validate input
        const validationError = validateProposal(input);
        if (validationError) {
            return { success: false, error: validationError };
        }

        const supabase = createServiceRoleClient();

        // 3. Check for duplicate pending proposals from same provider
        const { data: existingProposals } = await supabase
            .from('item_proposals')
            .select('id')
            .eq('provider_id', user.id)
            .eq('name', input.name.trim())
            .eq('status', 'PENDING')
            .limit(1);

        if (existingProposals && existingProposals.length > 0) {
            return {
                success: false,
                error: 'Ya tienes una propuesta pendiente con este nombre'
            };
        }

        // 4. Insert proposal
        const { data: proposal, error: insertErr } = await supabase
            .from('item_proposals')
            .insert({
                provider_id: user.id,
                name: input.name.trim(),
                description: input.description?.trim() || null,
                category: input.category.trim(),
                item_type: input.itemType,
                estimated_cost: Math.round(input.estimatedCost),
                unit_label: input.unitLabel.trim(),
                status: 'PENDING',
            })
            .select('id')
            .single();

        if (insertErr) {
            logger.error('[submitItemProposal] Insert error:', insertErr);
            return { success: false, error: 'Error guardando propuesta' };
        }

        return {
            success: true,
            proposalId: proposal.id,
        };
    } catch (error) {
        logger.error('[submitItemProposal] Unexpected error:', error);
        const message = error instanceof Error ? error.message : 'Error interno';
        return { success: false, error: message };
    }
}
