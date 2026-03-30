import { NextResponse } from 'next/server';
import { requireAuth, requireRole, Role } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';

/**
 * HOC de Seguridad para API Routes
 * 
 * Permite envolver el handler de una ruta para asegurar autenticación y roles.
 * 
 * @param roles Lista de roles permitidos. Si es null, solo requiere auth básica.
 * @param handler Función que procesa la petición si el usuario es válido.
 */
export async function withSecurity(
  roles: Role[] | null,
  handler: (user: any, context: any) => Promise<NextResponse | Response>,
  _request: Request,
  context: any = {}
) {
  try {
    // 1. Validar identidad y roles utilizando la infra existente
    const { user } = roles 
      ? await requireRole(...roles)
      : await requireAuth();
    
    // 2. Ejecutar el handler original
    return await handler(user, context);
  } catch (error: any) {
    // 3. Mapear errores de negocio a respuestas HTTP claras
    const message = error instanceof Error ? error.message : String(error);
    
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Inicie sesión para acceder' }, 
        { status: 401 }
      );
    }
    
    if (message === 'FORBIDDEN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'No tiene permisos suficientes' }, 
        { status: 403 }
      );
    }

    console.error('[API Security Error]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Error interno de seguridad' }, 
      { status: 500 }
    );
  }
}

/**
 * Helper para rutas que solo requieren ser ADMIN
 */
export const withAdmin = (
  handler: (user: any, context: any) => Promise<NextResponse | Response>,
  request: Request,
  context: any = {}
) => withSecurity([UserRole.ADMIN], handler, request, context);
