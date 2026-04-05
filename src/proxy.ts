import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { metrics } from './infrastructure/telemetry/MetricsService';
import { logger } from './infrastructure/telemetry/StructuredLogger';
import { UserRole, normalizeRole } from './core/domain/auth/UserRole';
import { validateRedirectUrl } from './lib/security/redirect-validator';

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

export async function proxy(request: NextRequest) {
  const start = Date.now();
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';

  // 🛡️ API Rate Limiting radical en rutas sensibles
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
    if (rateLimitMap.size > 5000) rateLimitMap.clear();
  }

  // 🛡️ Inicializar respuesta con Headers de Seguridad
  let response = NextResponse.next();
  
  // Security Headers (Identity Fortress)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Basic CSP (Self-host + Supabase)
  const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co;";
  response.headers.set('Content-Security-Policy', csp);

  // 1. Permitir rutas públicas sin verificación
  if (PUBLIC_ROUTES.some((pattern) => pattern.test(pathname))) {
    recordTelemetry(start, pathname, request.method, response.status.toString());
    return response;
  }

  // 2. Crear cliente Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Structured logging — only in development to avoid leaking env status in production
  if (process.env.NODE_ENV === 'development') {
    logger.debug('[Middleware] Supabase env check', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      supabaseEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
    });
  }
  
  if (!supabaseUrl || !supabaseKey) {
    logger.error('Missing Supabase env vars in middleware', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      availableKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    });
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // 3. Verificar sesión
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    const isProtected = PROTECTED_ROUTES.some((r) => r.pattern.test(pathname));

    if (isProtected) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      
      // 🛡️ Layer 3: Redirect Sanitization (Anti-Open Redirect)
      const safeRedirect = validateRedirectUrl(pathname, '/client');
      loginUrl.searchParams.set('redirect', safeRedirect);
      
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // 4. Verificar roles para rutas protegidas
  const isProtectedRoute = PROTECTED_ROUTES.find((r) => r.pattern.test(pathname));
  
  if (isProtectedRoute) {
    const userRole = normalizeRole(user.app_metadata?.role || user.user_metadata?.role);

    if (!isProtectedRoute.roles.includes(userRole)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden', message: `Acceso denegado` }, { status: 403 });
      }
      
      // Redirect al dashboard apropiado según su rol para evitar bucles
      const target = userRole === UserRole.ADMIN ? '/admin' : userRole === UserRole.VENDOR ? '/vendor' : '/client';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  recordTelemetry(start, pathname, request.method, response.status.toString());
  return response;
}

/**
 * NASA-Grade Telemetry helper
 */
function recordTelemetry(start: number, path: string, method: string, status: string) {
    const duration = Date.now() - start;
    metrics.increment('tech.http.requests', 1, { path, method, status });
    metrics.record('tech.http.latency', duration, { path, method });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
