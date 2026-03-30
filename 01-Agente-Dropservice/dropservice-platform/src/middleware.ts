import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { metrics } from './infrastructure/telemetry/MetricsService';
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

export async function middleware(request: NextRequest) {
  const start = Date.now();
  const { pathname } = request.nextUrl;

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
  for (const route of PROTECTED_ROUTES) {
    if (!route.pattern.test(pathname)) continue;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = normalizeRole(profile?.role);

    if (!route.roles.includes(userRole)) {
      if (pathname.startsWith('/api/')) {
        const response = NextResponse.json(
          {
            error: 'Forbidden',
            message: `Role '${userRole}' does not have access to this resource`,
            requiredRoles: route.roles,
          },
          { status: 403 },
        );
        recordTelemetry(start, pathname, request.method, '403');
        return response;
      }

      if (route.redirectTo) {
        const response = NextResponse.redirect(new URL(route.redirectTo, request.url));
        recordTelemetry(start, pathname, request.method, '307');
        return response;
      }
    }

    break;
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
