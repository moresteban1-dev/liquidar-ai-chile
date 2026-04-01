import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/infrastructure/di/bindings'
import { DashboardCollector } from '@/infrastructure/telemetry/DashboardCollector'
import { SupabaseClient } from '@supabase/supabase-js'
import { withRole, AuthenticatedUser } from '@/infrastructure/http/middleware/RBACMiddleware'
import { handleError } from '@/infrastructure/http/middleware/errorHandler'

export const GET = withRole(['admin'],
  async (request: NextRequest, { user }: { params: Promise<Record<string, string>>; user: AuthenticatedUser }) => {
    try {
      const client = container.resolve<SupabaseClient>('SupabaseClient')
      const collector = new DashboardCollector(client)
      const result = await collector.collectServiceHealth()
      if (result.isFailure()) return NextResponse.json({ error: result.error }, { status: 500 })
      return NextResponse.json(result.value)
    } catch (error) { return handleError(error) }
  }
)
