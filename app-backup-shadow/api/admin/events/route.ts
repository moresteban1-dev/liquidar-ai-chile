import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/di/bindings'
import { EventProcessor } from '@/infrastructure/events/EventProcessor'
import { setupEventHandlers } from '@/infrastructure/events/setupEventHandlers'
import { SupabaseClient } from '@supabase/supabase-js'
import { withRole, AuthenticatedUser } from '@/infrastructure/http/middleware/RBACMiddleware'
import { handleError } from '@/infrastructure/http/middleware/errorHandler'

export const GET = withRole(['admin'], async (request: NextRequest) => {
  try {
    const client = container.resolve<SupabaseClient>('SupabaseClient')
    const processor = new EventProcessor(client)
    const stats = await processor.getStats()
    const { data: recent } = await client.from('domain_events').select('*').order('occurred_at', { ascending: false }).limit(20)
    return NextResponse.json({ stats, recent: recent || [] })
  } catch (error) { return handleError(error) }
})

export const POST = withRole(['admin'], async (request: NextRequest) => {
  try {
    const client = container.resolve<SupabaseClient>('SupabaseClient')
    const processor = new EventProcessor(client)
    setupEventHandlers(processor)
    const result = await processor.processAll(50)
    return NextResponse.json({ success: true, result })
  } catch (error) { return handleError(error) }
})
