import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, Role, User } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { logSecurityEvent, AuditSeverity } from '@/lib/security/audit-logger';

// ============================================
// TYPES
// ============================================

export type SecurityContext = {
    user: User;
    userId: string;
    userRole: string;
    userEmail: string;
    clientIp: string;
    userAgent: string;
    params?: Record<string, string | string[]>;
};

type IncomingRequest = Request | NextRequest;

type SecureHandler = (
    user: User,
    context: SecurityContext,
    req: NextRequest
) => Promise<NextResponse | Response>;

interface SecurityOptions {
    requiredRoles?: Role[];
    rateLimit?: {
        maxAttempts: number;
        windowMs: number;
    };
    auditAction?: string;
    skipRateLimit?: boolean;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Ensures we always work with a NextRequest.
 */
function ensureNextRequest(req: IncomingRequest): NextRequest {
    if (req instanceof NextRequest) return req;
    
    return new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        // @ts-ignore - NextRequest accepts this in runtime
        duplex: 'half'
    });
}

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        (req as any).ip ||
        'unknown'
    );
}

// ============================================
// CORE HOC
// ============================================

/**
 * Enterprise-Grade Security HOC
 * Supports bidirectional Request | NextRequest compatibility with integrated Audit & RateLimit.
 */
export async function withSecurity(
    handler: SecureHandler,
    options: SecurityOptions = {},
    incomingReq: IncomingRequest,
    context: Partial<SecurityContext> = {}
) {
    const req = ensureNextRequest(incomingReq);
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
        // 1. Rate Limiting
        if (!options.skipRateLimit) {
            const limitConfig = options.rateLimit || RATE_LIMITS.client;
            const limitResult = await rateLimit({
                identifier: clientIp,
                action: options.auditAction || 'api-access',
                ...limitConfig
            });

            if (!limitResult.allowed) {
                await logSecurityEvent({
                    action: 'RATE_LIMIT_EXCEEDED',
                    actor: 'anonymous',
                    ip: clientIp,
                    userAgent,
                    severity: 'MEDIUM',
                    metadata: { path: req.nextUrl.pathname, action: options.auditAction }
                });

                return NextResponse.json(
                    { error: 'Too many requests', message: 'Rate limit exceeded' },
                    { status: 429 }
                );
            }
        }

        // 2. Validate identity and roles
        const authResult = options.requiredRoles
            ? await requireRole(...options.requiredRoles)
            : await requireAuth();

        if (authResult.isFailure()) {
            const error = authResult.getError();
            const status = error.code === 'UNAUTHORIZED' ? 401 : 403;
            
            await logSecurityEvent({
                action: 'SECURITY_DENIED',
                actor: 'anonymous',
                ip: clientIp,
                userAgent,
                severity: status === 401 ? 'LOW' : 'HIGH',
                metadata: { path: req.nextUrl.pathname, code: error.code }
            });

            return NextResponse.json(
                { 
                    error: error.code || 'Security Error', 
                    message: error.message || 'Access Denied' 
                },
                { status }
            );
        }

        const user = authResult.getValue().user;
        const securityContext: SecurityContext = {
            user,
            userId: user.id,
            userRole: user.role || 'CLIENT',
            userEmail: user.email || '',
            clientIp,
            userAgent,
            params: (context.params as Record<string, string | string[]>) || {}
        };

        // 3. Audit Logging (if configured)
        if (options.auditAction) {
            await logSecurityEvent({
                action: options.auditAction,
                actor: user.id,
                ip: clientIp,
                userAgent,
                severity: 'LOW',
                metadata: { path: req.nextUrl.pathname }
            });
        }

        // 4. Exec handler
        return await handler(user, securityContext, req);
    } catch (error: unknown) {
        console.error('[API Security Error]:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'Error interno de seguridad' },
            { status: 500 }
        );
    }
}

// ============================================
// WRAPPERS
// ============================================

/**
 * Pre-configured wrapper for Admin routes
 */
export const withAdmin = (
    handler: SecureHandler,
    request: IncomingRequest,
    context: Partial<SecurityContext> = {}
) => withSecurity(
    handler, 
    { 
        requiredRoles: [UserRole.ADMIN],
        auditAction: 'ADMIN_ACCESS',
        rateLimit: RATE_LIMITS.admin
    }, 
    request, 
    context
);

/**
 * Pre-configured wrapper for Provider/Vendor routes
 */
export const withProvider = (
    handler: SecureHandler,
    request: IncomingRequest,
    context: Partial<SecurityContext> = {}
) => withSecurity(
    handler, 
    { 
        requiredRoles: [UserRole.VENDOR, UserRole.ADMIN],
        auditAction: 'VENDOR_ACCESS',
        rateLimit: RATE_LIMITS.provider
    }, 
    request, 
    context
);
