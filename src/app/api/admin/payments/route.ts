// ============================================================
// app/api/admin/payments/route.ts
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdmin } from '@/lib/api/with-auth';

export const runtime = 'nodejs';

export const GET = withAdmin(async (request) => {
    const supabase = await createClient();

    // Params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const gateway = searchParams.get('gateway');
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('payments')
        .select(`
            *,
            user:user_id(email, full_name),
            gateway:gateway_slug(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (gateway && gateway !== 'all') {
        query = query.eq('gateway_slug', gateway);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
        payments: data,
        total: count,
        page,
        limit,
    });
});
