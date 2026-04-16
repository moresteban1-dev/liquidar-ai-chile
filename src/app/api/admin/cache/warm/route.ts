import { NextRequest } from 'next/server';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';
import { ok } from '@/infrastructure/http/helpers/responses';
import { getContainer } from '@/infrastructure/di/Container';

export const POST = adminRoute(async (_req: NextRequest, _ctx: MiddlewareContext) => {
  // Warming logic: Fetch core entities to populate cache
  const container = await getContainer();
  const supabase = await container.resolve<any>('supabase');
  
  const startTime = Date.now();
  
  // Parallel fetch of critical data
  await Promise.all([
    supabase.from('catalog_items').select('*').limit(100),
    supabase.from('users').select('id, role').eq('role', 'admin'),
    supabase.from('settings').select('*')
  ]);

  return ok({
    message: 'Cache warming triggered',
    durationMs: Date.now() - startTime
  });
});
