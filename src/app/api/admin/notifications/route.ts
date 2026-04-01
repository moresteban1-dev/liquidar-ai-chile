import { NextRequest } from 'next/server';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';
import { ok } from '@/infrastructure/http/helpers/responses';
import { container } from '@/infrastructure/di/Container';

export const GET = adminRoute(async (req: NextRequest, _ctx: MiddlewareContext) => {
  const supabase = await container.resolve<any>('supabase');
  const { searchParams } = new URL(req.url);
  
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const channel = searchParams.get('channel');
  const status = searchParams.get('status');

  let query = supabase
    .from('notification_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (channel) query = query.eq('channel', channel);
  if (status) query = query.eq('status', status);

  const { data, count, error } = await query;

  if (error) throw error;

  return ok({
    notifications: data || [],
    total: count || 0,
    page: Math.floor(offset / limit) + 1,
    limit
  });
});
