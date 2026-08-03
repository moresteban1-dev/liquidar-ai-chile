import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { UserRole, normalizeRole } from './core/domain/auth/UserRole';
import { validateRedirectUrl } from './lib/security/redirect-validator';

const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA';
const ADMIN_EMAILS = ['moresteban1@gmail.com', 'admin@liquidar.cl'];

/**
 * Configuración de rutas protegidas por rol.
 */
const PROTECTED_ROUTES: Array<{
  pattern: RegExp;
  roles: UserRole[];
  redirectTo: string;
}> = [
  {
    pattern: /^\/admin(\/.*)?$/,
    roles: [UserRole.ADMIN],
    redirectTo: '/login?error=unauthorized',
  },
  {
    pattern: /^\/api\/admin(\/.*)?$/,
    roles: [UserRole.ADMIN],
    redirectTo: '', // API routes retornan 403, no redirigen
  },
  {
    pattern: /^\/vendor(\/.*)?$/,
    roles: [UserRole.ADMIN, UserRole.VENDOR],
    redirectTo: '/login',
  },
  {
    pattern: /^\/client(\/.*)?$/,
    roles: [UserRole.ADMIN, UserRole.CLIENT],
    redirectTo: '/login',
  },
];

/**
 * Rutas públicas que NO requieren autenticación en middleware.
 */
const PUBLIC_ROUTES = [
  /^\/$/,
  /^\/login/,
  /^\/register/,
  /^\/sobre-nosotros/,
  /^\/vender/,
  /^\/subastas(\/.*)?$/,
  /^\/como-funciona/,
  /^\/cotizador/,
  /^\/forgot-password/,
  /^\/api\/auth(\/.*)?$/,
  /^\/api\/webhooks(\/.*)?$/,
  /^\/api\/health/,
  /^\/_next(\/.*)?$/,
  /^\/favicon/,
  /^\/public/,
  /^\/logo/,
  /^\/.*\.png$/,
  /^\/.*\.jpg$/,
  /^\/.*\.ico$/,
];

// PROTECCIÓN AAA: Rate Limiting en memoria para el Middleware (Edge Compatible)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 60; // 60 peticiones
const RATE_WINDOW = 60 * 1000; // por minuto

function resolveUserRole(user: { email?: string; app_metadata?: any; user_metadata?: any }): UserRole {
  if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return UserRole.ADMIN;
  }
  return normalizeRole(user?.app_metadata?.role || user?.user_metadata?.role);
}

export async function proxy(request: NextRequest) {
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
      console.warn(`[SECURITY] Rate Limit exceeded for IP: ${ip} on ${pathname}`);
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
    return response;
  }

  // 2. Crear cliente Supabase con Fallback Resiliente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  
  try {
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

    // 3. Verificar sesión o cookie de acceso directo / demo
    const demoRole = request.cookies.get('demo_role')?.value;
    if (demoRole) {
      return response;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const isProtected = PROTECTED_ROUTES.some((r) => r.pattern.test(pathname));

      if (isProtected) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        
        // 🛡️ Redirect Sanitization (Anti-Open Redirect)
        const safeRedirect = validateRedirectUrl(pathname, '/client');
        loginUrl.searchParams.set('redirect', safeRedirect);
        
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    // 4. Verificar roles para rutas protegidas
    const isProtectedRoute = PROTECTED_ROUTES.find((r) => r.pattern.test(pathname));
    
    if (isProtectedRoute) {
      const userRole = resolveUserRole(user);

      if (!isProtectedRoute.roles.includes(userRole)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden', message: `Acceso denegado` }, { status: 403 });
        }
        
        // Redirect al dashboard apropiado según su rol para evitar bucles
        const target = userRole === UserRole.ADMIN ? '/admin' : userRole === UserRole.VENDOR ? '/vendor' : '/client';
        return NextResponse.redirect(new URL(target, request.url));
      }
    }
  } catch (err) {
    console.error('[Edge Proxy Error] Supabase auth check failed:', err);
    // Safe fallback: allow public or redirect to login if protected
    if (PROTECTED_ROUTES.some((r) => r.pattern.test(pathname))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}
