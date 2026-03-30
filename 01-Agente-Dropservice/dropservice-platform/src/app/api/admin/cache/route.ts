import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/di/Container';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';

export const GET = adminRoute(async (_req: NextRequest, _ctx: MiddlewareContext) => {
  try {
    const container = await getContainer();
    const cache = await container.resolve<any>('CacheManager');
    
    if (!cache) {
      return NextResponse.json({ error: 'Cache Manager not available' }, { status: 503 });
    }

    const stats = {
      size: cache.size || 0,
      maxEntries: cache.maxEntries || 0,
      hits: cache.hits || 0,
      misses: cache.misses || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error en /api/admin/cache:', error as Error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

export const DELETE = adminRoute(async (_req: NextRequest, _ctx: MiddlewareContext) => {
  try {
    const container = await getContainer();
    const cache = await container.resolve<any>('CacheManager');
    
    if (cache) {
        cache.clear();
    }

    return NextResponse.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    logger.error('Error clearing cache:', error as Error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
