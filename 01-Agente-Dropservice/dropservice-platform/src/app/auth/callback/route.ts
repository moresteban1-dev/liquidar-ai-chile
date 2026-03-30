/**
 * OAuth Callback Route
 * Handles Supabase OAuth callback for Google authentication
 * Creates/updates user profile and links pending quotations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withRateLimit } from '@/lib/rate-limit';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { UserRole } from '@/core/domain/auth/UserRole';

export const dynamic = 'force-dynamic';
// Forzar ejecución en el entorno estándar de Node.js de Vercel en lugar de Edge (mitiga TypeError: fetch failed)
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    // 🛡️ API Rate Limiting: Prevenir Spam de Logins / Desbordamiento de BD
    const rateLimitResponse = await withRateLimit(request, 'auth-callback', { limit: 5, windowMs: 60000 });
    if (rateLimitResponse) return rateLimitResponse;

    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/client';

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
    }

    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        // Exchange code for session
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !session) {
            logger.error('OAuth callback error:', error);
            return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
        }

        const user = session.user;

        // Check if profile exists
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role || UserRole.CLIENT;

        // 🔄 Sync Role to Auth Metadata (for Middleware/RBAC optimization)
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll() { return []; }, setAll() {} } }
        );

        await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { role: role },
            app_metadata: { role: role }
        });

        let targetUrl = '/client';

        switch (role) {
            case UserRole.ADMIN:
                targetUrl = '/admin';
                break;
            case UserRole.VENDOR:
                targetUrl = '/vendor';
                break;
            case UserRole.CLIENT:
                targetUrl = '/client';
                break;
        }

        // Check for pending quotation to show success message
        const pendingQuoteCode = requestUrl.searchParams.get('quote');
        if (pendingQuoteCode) {
            targetUrl = `/client/quotations/${pendingQuoteCode}`;
        }

        // Override with `next` param if set
        if (next && next !== '/' && next !== '/auth/callback') {
            targetUrl = next;
        }

        return NextResponse.redirect(new URL(targetUrl, request.url));
    } catch (err) {
        logger.error('OAuth callback exception:', err);
        return NextResponse.redirect(new URL('/login?error=server_error', request.url));
    }
}
