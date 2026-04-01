import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/bindings';
import { CacheManager } from '@/infrastructure/cache/CacheManager';
import { adminRoute } from '@/lib/auth/admin-route';

/**
 * GET /api/admin/cache
 * Get cache statistics.
 */
export const GET = adminRoute(async () => {
  const cache = container.resolve<CacheManager>('CacheManager');
  return NextResponse.json(cache.getStats());
});

/**
 * DELETE /api/admin/cache
 * Clear or target invalidation.
 * query params: prefix, tag
 */
export const DELETE = adminRoute(async (req: NextRequest) => {
  const cache = container.resolve<CacheManager>('CacheManager');
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix');
  const tag = searchParams.get('tag');

  if (prefix) {
    const count = cache.invalidateByPrefix(prefix);
    return NextResponse.json({ success: true, count, type: 'prefix', value: prefix });
  }

  if (tag) {
    const count = cache.invalidateByTag(tag);
    return NextResponse.json({ success: true, count, type: 'tag', value: tag });
  }

  // Clear all if no params
  cache.clear();
  return NextResponse.json({ success: true, message: 'Cache cleared completely' });
});
