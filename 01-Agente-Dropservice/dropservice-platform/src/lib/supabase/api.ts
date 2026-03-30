/**
 * Supabase Server API Utilities
 * 
 * Provides typed helpers for API routes to access Supabase
 * with proper authentication context.
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import { UserRole, normalizeRole } from '@/core/domain/auth/UserRole';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

// Database types (generated from Supabase)
export type Role = UserRole;

export interface User {
    id: string;
    email: string;
    name: string | null;
    role: Role;
}

/**
 * Create Supabase client for server-side API routes
 */
export async function createApiClient(): Promise<Result<any, AppError>> {
    const cookieStore = await cookies();

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        logger.error('API Error: Missing Supabase Env Vars');
        return fail(AppError.internal('Supabase configuration missing in API'));
    }

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
 * Bypasses RLS policies. Use with caution.
 */
export function createServiceRoleClient() {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    return createServerClient(supabaseUrl, supabaseServiceKey, {
        cookies: {
            getAll() { return []; },
            setAll() { },
        },
    });
}

/**
 * Create Service Role Client with Cookie Access (Server Actions)
 * Essential for flows requiring PKCE (like resetPasswordForEmail) 
 * where the verifier must be stored in the user's browser.
 */
export async function createServiceRoleClientAction() {
    const cookieStore = await cookies();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY!;

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
 * Get authenticated user from Supabase session
 */
export async function getAuthUser(): Promise<Result<User, AppError>> {
    const supabaseRes = await createApiClient();
    if (supabaseRes.kind === 'failure') {
        return fail(AppError.unauthorized('No se pudo crear el cliente de API'));
    }
    
    const supabase = supabaseRes.getValue();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return fail(AppError.unauthorized('Usuario no autenticado'));

    // Use Service Role for profile lookup to bypass recursive RLS policies
    const serviceClient = createServiceRoleClient();
    const { data: profile } = await serviceClient
        .from('profiles')
        .select('id, email, name, role')
        .eq('id', user.id)
        .single();

    if (!profile) return fail(AppError.notFound('Perfil de usuario', user.id));

    return ok({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: normalizeRole(profile.role),
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
