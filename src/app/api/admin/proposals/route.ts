import { env } from '@/config/env';
/**
 * Item Proposals Admin API
 * GET: List all proposals (admin only)
 * PATCH: Review a proposal (approve/reject)
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { withAdmin } from '@/lib/api/with-auth';

// Helper for admin operations (RLS bypass)
const createAdminClient = () => createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
);

export const GET = withAdmin(async (request) => {
    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const { data: proposals, error } = await adminClient
        .from('item_proposals')
        .select(`
            id, name, description, category, item_type,
            estimated_cost, unit_label, status,
            admin_notes, reviewed_at, created_at,
            provider:provider_id (
                id, raw_user_meta_data->company_name
            )
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('[ItemProposals API] Fetch error:', error);
        return NextResponse.json({ error: 'Error cargando propuestas' }, { status: 500 });
    }

    return NextResponse.json({ proposals: proposals || [] });
});

export const PATCH = withAdmin(async (request, user) => {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { proposalId, action, adminNotes } = body;

    if (!proposalId) {
        return NextResponse.json({ error: 'proposalId es requerido' }, { status: 400 });
    }
    if (!['APPROVED', 'REJECTED'].includes(action)) {
        return NextResponse.json({ error: 'action debe ser APPROVED o REJECTED' }, { status: 400 });
    }

    // Verify proposal exists and is PENDING
    const { data: proposal, error: fetchErr } = await adminClient
        .from('item_proposals')
        .select('id, status, name')
        .eq('id', proposalId)
        .single();

    if (fetchErr || !proposal) {
        return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    }

    if (proposal.status !== 'PENDING') {
        return NextResponse.json(
            { error: `Propuesta ya fue ${proposal.status === 'APPROVED' ? 'aprobada' : 'rechazada'}` },
            { status: 400 }
        );
    }

    // Update proposal status
    const { error: updateErr } = await adminClient
        .from('item_proposals')
        .update({
            status: action,
            admin_notes: adminNotes?.trim() || null,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

    if (updateErr) {
        logger.error('[ItemProposals API] Update error:', updateErr);
        return NextResponse.json({ error: 'Error actualizando propuesta' }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        status: action,
        message: action === 'APPROVED'
            ? `Propuesta "${proposal.name}" aprobada`
            : `Propuesta "${proposal.name}" rechazada`,
    });
});
