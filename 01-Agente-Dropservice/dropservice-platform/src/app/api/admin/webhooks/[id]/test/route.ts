import { NextRequest } from 'next/server';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';
import { ok } from '@/infrastructure/http/helpers/responses';
import { container } from '@/infrastructure/di/Container';

export const POST = adminRoute(async (req: NextRequest, _ctx: MiddlewareContext) => {
  // Extract ID from URL since it's a dynamic route
  const id = req.nextUrl.pathname.split('/')[4]; 
  const supabase = await container.resolve<any>('supabase');

  const { data: webhook } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', id)
    .single();

  if (!webhook) return ok({ error: 'Webhook not found' }, { status: 404 } as any);

  try {
    const start = Date.now();
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Test': 'true' },
      body: JSON.stringify({
        event: 'test.ping',
        timestamp: new Date().toISOString(),
        payload: { message: 'This is a test notification from Dropservice Operations Center' }
      })
    });

    return ok({
      status: response.status,
      ok: response.ok,
      durationMs: Date.now() - start
    });
  } catch (e) {
    return ok({
      error: e instanceof Error ? e.message : 'Fetch failed'
    });
  }
});
