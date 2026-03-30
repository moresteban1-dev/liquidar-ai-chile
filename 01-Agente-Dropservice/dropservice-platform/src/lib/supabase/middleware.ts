import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { UserRole, normalizeRole } from '../../core/domain/auth/UserRole';
import { logger } from '../../infrastructure/telemetry/StructuredLogger';
import { rateLimit } from '../rate-limiter';

/**
 * Consolidated Middleware Logic
 * Handles: Session refresh, RBAC, Rate Limiting, Correlation ID, and Security Headers.
 */
export async function updateSession(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Static assets - skip early
    if (pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js)$/)) {
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Environment Validation
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey) {
        logger.error("Supabase environment variables are missing in Middleware");
        return supabaseResponse;
    }

    // Correlation ID
    const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
    request.headers.set('x-correlation-id', correlationId);
    supabaseResponse.headers.set('x-correlation-id', correlationId);

    // Security Headers
    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
    supabaseResponse.headers.set('X-Frame-Options', 'DENY');
    supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block');
    supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Supabase Client Initialization
    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    supabaseResponse = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    supabaseResponse.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    supabaseResponse = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    supabaseResponse.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // Identity Refresh
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        supabaseResponse.headers.set('x-user-id', user.id);
        request.headers.set('x-user-id', user.id);
    }

    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'ip';
    
    // Auth Routes Limit
    if (pathname.startsWith('/api/auth')) {
        const isAllowed = await rateLimit(`auth-${ip}`, 10, 60_000);
        if (!isAllowed) {
            return new NextResponse(
                JSON.stringify({ error: 'Too Many Requests', retryAfter: 60 }),
                { status: 429, headers: { 'content-type': 'application/json' } }
            );
        }
    }

    // AI Routes Limit
    if (pathname.startsWith('/api/ai')) {
        const isAllowed = await rateLimit(`ai-${ip}`, 20, 60_000);
        if (!isAllowed) {
            return new NextResponse(
                JSON.stringify({ error: 'AI Rate Limit Exceeded', retryAfter: 60 }),
                { status: 429, headers: { 'content-type': 'application/json' } }
            );
        }
    }

    // Access Control (RBAC)
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isProtectedRoute = 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/client') || 
        pathname.startsWith('/vendor') ||
        pathname.startsWith('/api/admin') ||
        pathname.startsWith('/api/client') ||
        pathname.startsWith('/api/vendor');

    if (!user && isProtectedRoute) {
        if (pathname.startsWith('/api/')) {
            return new NextResponse(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'content-type': 'application/json' } }
            );
        }
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
    }

    if (user && isAuthRoute) {
        const userRole = normalizeRole(user?.app_metadata?.['role'] || user?.user_metadata?.['role']);
        let targetUrl = '/client'
        if (userRole === UserRole.ADMIN) targetUrl = '/admin'
        else if (userRole === UserRole.VENDOR) targetUrl = '/vendor'
        
        return NextResponse.redirect(new URL(targetUrl, request.url))
    }

    // Detailed Role Check
    if (user && isProtectedRoute) {
        const userRole = normalizeRole(user?.app_metadata?.['role'] || user?.user_metadata?.['role']);
        const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
        const isVendorRoute = pathname.startsWith('/vendor') || pathname.startsWith('/api/vendor');
        const isClientRoute = pathname.startsWith('/client') || pathname.startsWith('/api/client');

        if (isAdminRoute && userRole !== UserRole.ADMIN) {
            return pathname.startsWith('/api/') 
                ? new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } })
                : NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        
        if (isVendorRoute && userRole !== UserRole.VENDOR && userRole !== UserRole.ADMIN) {
            return pathname.startsWith('/api/') 
                ? new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } })
                : NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        if (isClientRoute && userRole !== UserRole.CLIENT && userRole !== UserRole.ADMIN) {
            return pathname.startsWith('/api/') 
                ? new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } })
                : NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    return supabaseResponse
}
