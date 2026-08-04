import { env } from '@/config/env';
/**
 * OAuth Callback Route
 * Handles Supabase OAuth callback for Google authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withRateLimit } from '@/lib/security/rate-limiter';
import { UserRole } from '@/core/domain/auth/UserRole';

import { validateRedirectUrl } from '@/lib/security/redirect-validator';

export async function GET(request: NextRequest) {
    // API Rate Limiting
    const rateLimitResponse = await withRateLimit(request, 'auth-callback', { limit: 5, windowMs: 60000 });
    if (rateLimitResponse) return rateLimitResponse;

    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const nextParam = requestUrl.searchParams.get('next');

    const safeNext = validateRedirectUrl(nextParam, '/client');

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
    }

    try {
        const cookieStore = await cookies();

        const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
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
            console.error('[Auth Callback Error] Code exchange failed:', error);
            return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
        }

        const user = session.user;

        // Check if profile exists
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (profileErr) {
            console.warn('[Auth Callback] Could not fetch profile, RLS may be blocking:', profileErr.message);
        }

        let role = profile?.role || UserRole.CLIENT;

        // Create profile if it doesn't exist
        if (!profile) {
            const { error: insertErr } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
                    role: role,
                    created_at: new Date().toISOString()
                });
            if (insertErr) {
                console.warn('[Auth Callback] Profile creation failed. Relying on fallback role:', insertErr.message);
            }
        }

        // 🔄 Sync Role to Auth Metadata safely
        try {
            const supabaseAdmin = createServerClient(
                supabaseUrl,
                serviceKey,
                { cookies: { getAll() { return []; }, setAll() {} } }
            );

            const { error: adminAuthErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: { role: role },
                app_metadata: { role: role }
            });
            
            if (adminAuthErr) {
                console.warn('[Auth Callback Warning] Admin metadata update failed:', adminAuthErr.message);
            }
        } catch (adminErr) {
            console.warn('[Auth Callback Warning] Admin metadata update skipped:', adminErr);
        }

        // 🛡️ Final Redirection Logic
        // If 'next' was provided, use it (sanitized), otherwise use role-based default
        let targetUrl = safeNext;
        
        // If next is the default, apply role logic
        if (safeNext === '/client') {
            switch (role) {
                case UserRole.ADMIN: targetUrl = '/admin'; break;
                case UserRole.VENDOR: targetUrl = '/vendor'; break;
                case UserRole.CLIENT: targetUrl = '/client'; break;
            }
        }

        // Check for pending quotation
        const pendingQuoteCode = requestUrl.searchParams.get('quote');
        if (pendingQuoteCode) {
            targetUrl = `/client/quotations/${pendingQuoteCode}`;
        }

        return NextResponse.redirect(new URL(targetUrl, request.url));
    } catch {
        return NextResponse.redirect(new URL('/login?error=server_error', request.url));
    }
}
