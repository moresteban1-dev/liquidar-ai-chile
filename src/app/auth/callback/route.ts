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

        const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
        const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA';

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.supabase_SUPABASE_URL || DEFAULT_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.supabase_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

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
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        let role = profile?.role || UserRole.CLIENT;

        // Create profile if it doesn't exist
        if (!profile) {
            await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
                    role: role,
                    created_at: new Date().toISOString()
                });
        }

        // 🔄 Sync Role to Auth Metadata safely
        try {
            const supabaseAdmin = createServerClient(
                supabaseUrl,
                serviceKey,
                { cookies: { getAll() { return []; }, setAll() {} } }
            );

            await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: { role: role },
                app_metadata: { role: role }
            });
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
