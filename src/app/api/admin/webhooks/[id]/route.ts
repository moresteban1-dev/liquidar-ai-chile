import { NextRequest } from 'next/server';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';
import { ok } from '@/infrastructure/http/helpers/responses';
import { container } from '@/infrastructure/di/Container';

export const PATCH = adminRoute(async (req: NextRequest, _ctx: MiddlewareContext) => {
  const id = req.nextUrl.pathname.split('/').pop();
  const body = await req.json();
  const supabase = await container.resolve<any>('supabase');

  const { data, error } = await supabase
    .from('webhooks')
    .update({ active: body.active })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return ok({ webhook: data });
});

export const DELETE = adminRoute(async (req: NextRequest, _ctx: MiddlewareContext) => {
  const id = req.nextUrl.pathname.split('/').pop();
  const supabase = await container.resolve<any>('supabase');

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return ok({ message: 'Webhook deleted' });
});
