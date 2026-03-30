import { NextResponse } from 'next/server';
import { container } from '@/infrastructure/di/bindings';
import { CacheWarmer } from '@/infrastructure/cache/CacheWarmer';
import { adminRoute } from '@/lib/auth/admin-route';

/**
 * POST /api/admin/cache/warm
 * Manually trigger cache warming.
 */
export const POST = adminRoute(async () => {
  const warmer = container.resolve<CacheWarmer>('CacheWarmer');
  const results = await warmer.warmAll();
  
  return NextResponse.json({
    success: true,
    ...results
  });
});
