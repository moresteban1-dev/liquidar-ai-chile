/**
 * Supabase Server API Utilities — Liquidar.cl
 * 
 * Provides typed helpers for API routes to access Supabase
 * with proper authentication context and resilient error handling.
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import { UserRole, normalizeRole } from '@/core/domain/auth/UserRole';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

// Database types
export type Role = UserRole;

export interface User {
    id: string;
    email: string;
    name: string | null;
    role: Role;
}

/**
 * Official Admin Emails for Automatic Admin Dashboard Access
 */
export const ADMIN_EMAILS = [
    'inversionsanagustin@gmail.com',
    'moresteban1@gmail.com',
    'admin@liquidar.cl',
];

/**
 * Create Supabase client for server-side API routes
 */
export async function createApiClient(): Promise<Result<any, AppError>> {
    const cookieStore = await cookies();

    const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA';

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

    return ok(createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Called from Server Component - ignore
                    }
                },
            },
        }
    ));
}

/**
 * Create Supabase Admin client (Service Role)
 * Safe fallback to ANON_KEY if SUPABASE_SERVICE_ROLE_KEY is not defined.
 */
export function createServiceRoleClient() {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    return createServerClient(supabaseUrl, supabaseServiceKey, {
        cookies: {
            getAll() { return []; },
            setAll() { },
        },
    });
}

/**
 * Create Service Role Client with Cookie Access (Server Actions)
 */
export async function createServiceRoleClientAction() {
    const cookieStore = await cookies();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    return createServerClient(supabaseUrl, supabaseServiceKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // Ignore if called from context where cookies can't be set
                }
            },
        },
    });
}

/**
 * Get authenticated user from Supabase session with resilient fallback
 */
export async function getAuthUser(): Promise<Result<User, AppError>> {
    const supabaseRes = await createApiClient();
    if (supabaseRes.kind === 'failure') {
        return fail(AppError.unauthorized('No se pudo crear el cliente de autenticación'));
    }
    
    const supabase = supabaseRes.getValue();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return fail(AppError.unauthorized('Usuario no autenticado'));
    }

    const userEmail = (user.email ?? '').toLowerCase().trim();
    let role = UserRole.CLIENT;
    let name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Usuario';

    // Auto-promote official admin email
    if (ADMIN_EMAILS.includes(userEmail)) {
        role = UserRole.ADMIN;
    } else {
        try {
            const serviceClient = createServiceRoleClient();
            const { data: profile } = await serviceClient
                .from('profiles')
                .select('id, email, name, role')
                .eq('id', user.id)
                .maybeSingle();

            if (profile?.role) {
                role = normalizeRole(profile.role);
            } else if (user.user_metadata?.role) {
                role = normalizeRole(user.user_metadata.role);
            }

            if (profile?.name) {
                name = profile.name;
            }
        } catch {
            logger.warn('Profile lookup fallback triggered');
            role = normalizeRole(user.user_metadata?.role);
        }
    }

    return ok({
        id: user.id,
        email: user.email ?? '',
        name,
        role,
    });
}

/**
 * Require authenticated user - returns Result fail if not authenticated
 */
export async function requireAuth(): Promise<Result<{ user: User; supabase: any }, AppError>> {
    const userRes = await getAuthUser();
    if (userRes.isFailure()) return fail(userRes.getError());

    const supabaseRes = await createApiClient();
    if (supabaseRes.kind === 'failure') return fail(supabaseRes.getError());

    return ok({ user: userRes.getValue(), supabase: supabaseRes.getValue() });
}

/**
 * Require specific role - returns Result fail if not authorized
 */
export async function requireRole(...roles: Role[]): Promise<Result<{ user: User; supabase: any }, AppError>> {
    const authRes = await requireAuth();
    if (authRes.isFailure()) return authRes;

    const { user, supabase } = authRes.getValue();

    if (!roles.includes(user.role)) {
        return fail(AppError.forbidden(`Acceso denegado. Se requiere uno de: ${roles.join(', ')}`));
    }

    return ok({ user, supabase });
}
