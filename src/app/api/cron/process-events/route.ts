import { withInternalAuth } from '@/lib/api/with-auth';
import { getContainer } from '@/infrastructure/di/Container';
import { NextResponse } from 'next/server';

/**
 * Manual trigger for event processing.
 * Also used by Cron jobs.
 */
export const GET = withInternalAuth(async (_request) => {
  const container = await getContainer();
  const supabase = await container.resolve<any>('supabase');
  
  // Logic to process pending events
  const { data: events } = await supabase
    .from('event_outbox')
    .select('*')
    .eq('status', 'pending')
    .limit(10);

  // Placeholder for processing logic
  // for (const event of events) { ... }

  return NextResponse.json({
    success: true,
    processed: events?.length ?? 0
  });
});
