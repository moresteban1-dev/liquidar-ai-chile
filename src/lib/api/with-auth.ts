// src/lib/api/with-auth.ts

import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { UserRole, normalizeRole } from '@/core/domain/auth/UserRole';

export type { UserRole };

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  metadata?: Record<string, unknown>;
}

type ApiHandler = (
  request: NextRequest,
  user: AuthUser,
  params?: Record<string, string>,
) => Promise<Response>;

type PublicApiHandler = (
  request: NextRequest,
  params?: Record<string, string>,
) => Promise<Response>;

type InternalApiHandler = (
    request: NextRequest,
    params?: Record<string, string>,
) => Promise<Response>;

/**
 * Ensures unified and safe authentication for all API routes.
 * Normalizes roles to UPPERCASE and provides strict RBAC checks.
 */
export function withAuth(
  handler: ApiHandler,
  options?: { roles?: UserRole[] },
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> },
  ): Promise<Response> => {
    try {
      const supabase = await createClient();

      // 1. Authenticate via Supabase Auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.warn('[Auth] Unauthorized access attempt', { path: request.nextUrl.pathname });
        return Response.json(
          { error: 'Unauthorized', message: 'Valid session required' },
          { status: 401 },
        );
      }

      // 2. Authorize via Database Profile (Business Role)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, name, metadata')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
          logger.error('[Auth] Profile not found for user', { userId: user.id, profileError });
          return Response.json(
              { error: 'Forbidden', message: 'Tu perfil de usuario no existe. Contacta al administrador.' },
              { status: 403 }
          );
      }

      const userRoleFull = normalizeRole(profile.role);
      
      // 3. RBAC Check
      if (options?.roles && !options.roles.includes(userRoleFull)) {
        logger.warn('[Auth] Forbidden: Role mismatch', { 
            userId: user.id, 
            userRole: userRoleFull, 
            requiredRoles: options.roles,
            path: request.nextUrl.pathname 
        });
        return Response.json(
          {
            error: 'Forbidden',
            message: `Role '${userRoleFull}' insufficient for this resource`,
          },
          { status: 403 },
        );
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email ?? '',
        role: userRoleFull,
        name: profile.name || undefined,
        metadata: profile.metadata as Record<string, unknown> || {},
      };

      const params = context?.params ? await context.params : undefined;
      return await handler(request, authUser, params);
    } catch (err: unknown) {
      logger.error('[Auth] Internal Gateway Exception', err as Error);
      const message = err instanceof Error ? err.message : 'Internal server error';
      return Response.json({ error: message }, { status: 500 });
    }
  };
}

/**
 * Validates if the user owns the resource or is an Admin.
 */
export function requireOwnership(
    resourceOwnerId: string,
    user: AuthUser
): boolean {
    if (user.role === UserRole.ADMIN) {
        return true;
    }
    return user.id === resourceOwnerId;
}

/**
 * Shortcut for specific roles.
 */
export function withRole(roles: UserRole[], handler: ApiHandler) {
    return withAuth(handler, { roles });
}

/**
 * Shortcut for admin routes.
 */
export function withAdmin(handler: ApiHandler) {
  return withAuth(handler, { roles: [UserRole.ADMIN] });
}

/**
 * Generic handler for public APIs.
 */
export function withPublicApi(handler: PublicApiHandler) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> },
  ): Promise<Response> => {
    try {
      const params = context?.params ? await context.params : undefined;
      return await handler(request, params);
    } catch (err: unknown) {
      logger.error('[Auth] Public API Gateway Error', err as Error);
      const message = err instanceof Error ? err.message : 'Internal server error';
      return Response.json({ error: message }, { status: 500 });
    }
  };
}

/**
 * Specialized handler for Internal/System jobs (CRON).
 * Standardizes the CRON_SECRET check for PDS scanning.
 */
export function withInternalAuth(handler: InternalApiHandler) {
    return async (
        request: NextRequest,
        context?: { params?: Promise<Record<string, string>> },
    ): Promise<Response> => {
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Security Guard: Verify internal secret
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            if (process.env.NODE_ENV === 'production') {
                logger.warn('[Auth] Denied Internal Access: Invalid Secret');
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        try {
            const params = context?.params ? await context.params : undefined;
            return await handler(request, params);
        } catch (err: unknown) {
            logger.error('[Auth] Internal API Error', err as Error);
            return Response.json({ error: 'Internal Error' }, { status: 500 });
        }
    };
}

/**
 * Specialized handler for External Webhooks (Payments).
 * Can be extended to verify provider signatures.
 */
export function withWebhookAuth(handler: PublicApiHandler) {
    return async (
        request: NextRequest,
        context?: { params?: Promise<Record<string, string>> },
    ): Promise<Response> => {
        // [AUDIT]: Webhooks are theoretically public but should be restricted by IP or Signature
        try {
            const params = context?.params ? await context.params : undefined;
            return await handler(request, params);
        } catch (err: unknown) {
            logger.error('[Auth] Webhook Error', err as Error);
            return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
        }
    };
}
