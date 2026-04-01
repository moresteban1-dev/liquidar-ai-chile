import { NextRequest, NextResponse } from 'next/server'
import { alertEngine } from '@/infrastructure/telemetry/AlertEngine'
import { withRole, AuthenticatedUser } from '@/infrastructure/http/middleware/RBACMiddleware'
import { handleError } from '@/infrastructure/http/middleware/errorHandler'

export const GET = withRole(['admin'],
  async (request: NextRequest, { user }: { params: Promise<Record<string, string>>; user: AuthenticatedUser }) => {
    try {
      const activeAlerts = alertEngine.getActiveAlerts()
      return NextResponse.json({ activeAlerts, count: activeAlerts.length, timestamp: new Date().toISOString() })
    } catch (error) { return handleError(error) }
  }
)
