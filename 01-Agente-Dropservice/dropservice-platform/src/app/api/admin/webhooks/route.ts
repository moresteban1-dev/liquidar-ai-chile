import { NextRequest } from 'next/server';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';
import { ok } from '@/infrastructure/http/helpers/responses';
import { container } from '@/infrastructure/di/Container';

export const GET = adminRoute(async (_req: NextRequest, _ctx: MiddlewareContext) => {
  const supabase = await container.resolve<any>('supabase');

  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ok({ webhooks: data || [] });
});
