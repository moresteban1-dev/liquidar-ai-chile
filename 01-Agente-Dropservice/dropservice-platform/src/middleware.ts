import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { metrics } from './infrastructure/telemetry/MetricsService';
import { logger } from './infrastructure/telemetry/StructuredLogger';
import { UserRole, normalizeRole } from './core/domain/auth/UserRole';

/**
 * Configuración de rutas protegidas por rol.
 */
const PROTECTED_ROUTES: Array<{
  pattern: RegExp;
  roles: UserRole[];
  redirectTo: string;
}> = [
  {
    pattern: /^\/admin/,
    roles: [UserRole.ADMIN],
    redirectTo: '/login?error=unauthorized',
  },
  {
    pattern: /^\/api\/admin/,
    roles: [UserRole.ADMIN],
    redirectTo: '', // API routes retornan 403, no redirigen
  },
  {
    pattern: /^\/vendor/,
    roles: [UserRole.ADMIN, UserRole.VENDOR],
    redirectTo: '/login',
  },
  {
    pattern: /^\/client/,
    roles: [UserRole.ADMIN, UserRole.CLIENT],
    redirectTo: '/login',
  },
];

/**
 * Rutas públicas que NO requieren autenticación.
 */
const PUBLIC_ROUTES = [
  /^\/$/,
  /^\/login/,
  /^\/register/,
  /^\/api\/auth/,
  /^\/api\/webhooks/,
  /^\/api\/health/,
  /^\/_next/,
  /^\/favicon/,
  /^\/public/,
];

// PROTECCIÓN AAA: Rate Limiting en memoria para el Middleware (Edge Compatible)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 60; // 60 peticiones
const RATE_WINDOW = 60 * 1000; // por minuto

export async function middleware(request: NextRequest) {
  const start = Date.now();
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';

  // 0. Aplicar Rate Limiting radical en rutas sensibles
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/webhooks')) {
    const now = Date.now();
    const rateKey = `${ip}:${pathname}`;
    const record = rateLimitMap.get(rateKey) || { count: 0, reset: now + RATE_WINDOW };

    if (now > record.reset) {
      record.count = 1;
      record.reset = now + RATE_WINDOW;
    } else {
      record.count++;
    }

    rateLimitMap.set(rateKey, record);

    if (record.count > RATE_LIMIT) {
      logger.warn(`[SECURITY] Rate Limit exceeded for IP: ${ip} on ${pathname}`);
      return NextResponse.json(
        { error: 'Too many requests', message: 'Por favor, reintente en un minuto.' },
        { status: 429 }
      );
    }
    
    // Limpieza periódica del mapa (prevent memory leak)
    if (rateLimitMap.size > 5000) rateLimitMap.clear();
  }

  // 1. Permitir rutas públicas sin verificación (pero con telemetría)
  if (PUBLIC_ROUTES.some((pattern) => pattern.test(pathname))) {
    const response = NextResponse.next();
    recordTelemetry(start, pathname, request.method, response.status.toString());
    return response;
  }

  // 2. Crear cliente Supabase
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 3. Verificar sesión
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const isProtected = PROTECTED_ROUTES.some((r) => r.pattern.test(pathname));

    if (isProtected) {
      if (pathname.startsWith('/api/')) {
        const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        recordTelemetry(start, pathname, request.method, '401');
        return response;
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      recordTelemetry(start, pathname, request.method, '307');
      return response;
    }

    recordTelemetry(start, pathname, request.method, supabaseResponse.status.toString());
    return supabaseResponse;
  }

  // 4. Verificar roles para rutas protegidas
  const isProtectedRoute = PROTECTED_ROUTES.find((r) => r.pattern.test(pathname));
  
  if (isProtectedRoute) {
    // OPTIMIZACIÓN AAA: Extraer rol de app_metadata para evitar Query a DB en el Middleware
    const userRole = normalizeRole(user.app_metadata?.role || user.user_metadata?.role);

    if (!isProtectedRoute.roles.includes(userRole)) {
      if (pathname.startsWith('/api/')) {
        const response = NextResponse.json(
          {
            error: 'Forbidden',
            message: `Acceso denegado para el rol '${userRole}'`,
            requiredRoles: isProtectedRoute.roles,
          },
          { status: 403 },
        );
        recordTelemetry(start, pathname, request.method, '403');
        return response;
      }

      if (isProtectedRoute.redirectTo) {
        const response = NextResponse.redirect(new URL(isProtectedRoute.redirectTo, request.url));
        recordTelemetry(start, pathname, request.method, '307');
        return response;
      }
    }
  }

  recordTelemetry(start, pathname, request.method, supabaseResponse.status.toString());
  return supabaseResponse;
}

/**
 * Technical Telemetry [NASA-Grade] helper
 */
function recordTelemetry(start: number, path: string, method: string, status: string) {
    const duration = Date.now() - start;
    metrics.increment('tech.http.requests', 1, { path, method, status });
    metrics.record('tech.http.latency', duration, { path, method });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
