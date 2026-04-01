import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'
import { UserRole, normalizeRole } from '@/core/domain/auth/UserRole'

/**
 * RBAC Middleware - Implementation
 * 
 * Gestiona la autenticación y autorización basada en el token de Supabase.
 * Extrae el rol de negocio de la tabla 'users' para validación de permisos.
 */

// Re-export enum for backward compatibility if needed, but preferred to use direct import
export { UserRole };

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  metadata?: Record<string, unknown>
}

/**
 * Extrae y verifica el usuario a partir del token JWT en el header de Authorization
 */
export async function extractUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    if (token.trim().length === 0) {
      return null
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      if (error) {
        logger.warn('Token de autenticación inválido o expirado', {
          error: error.message
        })
      }
      return null
    }

    // Obtener rol del usuario de la base de datos interna usando Service Role (bypass RLS para validación)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: userData, error: userError } = await serviceClient
      .from('users')
      .select('role, metadata')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      logger.warn('Usuario no encontrado en la base de datos de negocio', { userId: user.id })
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      role: normalizeRole(userData.role),
      metadata: userData.metadata
    }

  } catch (error) {
    logger.error('Excepción al extraer usuario en middleware', error as Error)
    return null
  }
}

/**
 * Wrapper de orden superior para proteger rutas API requiriendo solo autenticación
 */
export function withAuth<T extends Record<string, string> = Record<string, string>>(
  handler: (
    request: NextRequest,
    context: { params: Promise<T>; user: AuthenticatedUser }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const user = await extractUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Autenticación requerida' },
        { status: 401 }
      )
    }

    return handler(request, { ...context, user })
  }
}

/**
 * Wrapper de orden superior para proteger rutas API requiriendo roles específicos
 */
export function withRole<T extends Record<string, string> = Record<string, string>>(
  allowedRoles: UserRole[],
  handler: (
    request: NextRequest,
    context: { params: Promise<T>; user: AuthenticatedUser }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const user = await extractUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Autenticación requerida' },
        { status: 401 }
      )
    }

    if (!allowedRoles.includes(user.role)) {
      logger.warn('Intento de acceso no autorizado (Insuficiencia de privilegios)', {
        userId: user.id,
        role: user.role,
        requiredRoles: allowedRoles,
        path: request.nextUrl.pathname
      })

      return NextResponse.json(
        { error: 'Permisos insuficientes para realizar esta acción' },
        { status: 403 }
      )
    }

    return handler(request, { ...context, user })
  }
}

/**
 * Verifica si el usuario es dueño del recurso o si es Admin
 */
export function requireOwnership(
  resourceOwnerId: string,
  user: AuthenticatedUser
): boolean {
  if (user.role === UserRole.ADMIN) {
    return true
  }

  return user.id === resourceOwnerId
}

/**
 * Ayudantes de respuesta para errores de seguridad estandarizados
 */
export const AuthErrors = {
  unauthorized: () => NextResponse.json(
    { error: 'Autenticación requerida' },
    { status: 401 }
  ),

  forbidden: (message?: string) => NextResponse.json(
    { error: message || 'Permisos insuficientes' },
    { status: 403 }
  ),

  notOwner: () => NextResponse.json(
    { error: 'No tienes acceso a este recurso' },
    { status: 403 }
  )
} as const
