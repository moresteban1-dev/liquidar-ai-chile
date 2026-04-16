import { NextRequest } from 'next/server';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';
import { ok } from '@/infrastructure/http/helpers/responses';
import { getContainer } from '@/infrastructure/di/Container';

export const GET = adminRoute(async (_req: NextRequest, _ctx: MiddlewareContext) => {
  const container = await getContainer();
  const supabase = await container.resolve<any>('supabase');

  // Count by status
  const statuses = ['pending', 'processing', 'completed', 'failed', 'dead'];
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const { count } = await supabase
      .from('event_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', status);

    counts[status] = count ?? 0;
  }

  // Recent events
  const { data: recentEvents } = await supabase
    .from('event_outbox')
    .select('id, event_type, aggregate_type, status, retry_count, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(20);

  return ok({
    ...counts,
    total: Object.values(counts).reduce((s, c) => s + c, 0),
    recentEvents: recentEvents ?? [],
  });
});
