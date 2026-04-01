import { NextRequest, NextResponse } from 'next/server'
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger'
import { UserRole } from '@/core/domain/auth/UserRole'

export type MiddlewareContext = {
  user?: {
    id: string
    email: string
    role: UserRole
  }
  traceId?: string
  startTime: number
  logger: StructuredLogger
  [key: string]: unknown
}

export type MiddlewareFn = (
  req: NextRequest,
  ctx: MiddlewareContext,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>

export type RouteHandler = (
  req: NextRequest,
  ctx: MiddlewareContext
) => Promise<NextResponse>

export function composeRoute(
  handler: RouteHandler,
  ...middlewares: MiddlewareFn[]
): (req: NextRequest, routeParams?: { params: Record<string, string> }) => Promise<NextResponse> {
  return async (req, routeParams) => {
    const ctx: MiddlewareContext = {
      startTime: Date.now(),
      logger: StructuredLogger.create({ component: 'api' }),
      routeParams: routeParams?.params
    }

    let currentHandler: () => Promise<NextResponse> = () => handler(req, ctx)

    for (let i = middlewares.length - 1; i >= 0; i--) {
      const middleware = middlewares[i]
      if (!middleware) continue
      const nextHandler = currentHandler
      currentHandler = () => middleware(req, ctx, nextHandler)
    }

    try {
      return await currentHandler()
    } catch (error) {
      ctx.logger.error('Unhandled error in route composition', { error })
      return NextResponse.json({
        success: false,
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
        meta: null,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  }
}

/**
 * Specialized route for Admins only.
 * Composes authentication and role check.
 */
export function adminRoute(handler: RouteHandler) {
  return composeRoute(
    handler,
    async (req, ctx, next) => {
      const { extractUser } = await import('./RBACMiddleware');
      const user = await extractUser(req);

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      ctx.user = user;
      return next();
    }
  );
}
