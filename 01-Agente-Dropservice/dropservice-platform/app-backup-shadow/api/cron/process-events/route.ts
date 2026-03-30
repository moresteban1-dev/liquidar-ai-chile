import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/di/bindings'
import { EventProcessor } from '@/infrastructure/events/EventProcessor'
import { setupEventHandlers } from '@/infrastructure/events/setupEventHandlers'
import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = container.resolve<SupabaseClient>('SupabaseClient')
    const processor = new EventProcessor(client)
    setupEventHandlers(processor)

    const result = await processor.processAll(100)
    const stats = await processor.getStats()

    logger.info('Event processing cron completed', { result, stats })
    return NextResponse.json({ success: true, result, stats })
  } catch (error) {
    logger.error('Event processing cron failed', error as Error)
    return NextResponse.json({ error: 'Failed', message: (error as Error).message }, { status: 500 })
  }
}
