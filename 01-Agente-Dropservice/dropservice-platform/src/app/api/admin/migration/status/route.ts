import { NextResponse } from 'next/server'
import { migrationMonitor } from '@/infrastructure/migration/MigrationMonitor'
import { rolloutController } from '@/infrastructure/migration/RolloutController'
import { featureFlags } from '@/infrastructure/feature-flags/FeatureFlags'
import { withAdmin } from '@/lib/api/with-auth'

/**
 * GET /api/admin/migration/status
 * 
 * Dashboard de estado de migración
 */
export const GET = withAdmin(
  async (_request, _user) => {
    try {
      const endpoints = [
        { path: '/api/orders', flag: 'v2-orders-create' },
        { path: '/api/orders/:id', flag: 'v2-orders-get' },
        { path: '/api/quotations', flag: 'v2-quotations' }
      ]

      const statuses = endpoints.map(ep => {
        const status = rolloutController.getStatus(ep.flag, ep.path)
        const report = migrationMonitor.generateReport(ep.path, 60)

        return {
          endpoint: ep.path,
          ...status,
          report: report.isSuccess() ? report.value : null,
          error: report.isFailure() ? report.error : null
        }
      })

      const overallProgress = statuses.reduce(
        (sum, s) => sum + s.currentPercentage,
        0
      ) / statuses.length

      return NextResponse.json({
        overallProgress: Math.round(overallProgress),
        rolloutPlan: rolloutController.getRolloutPlan(),
        endpoints: statuses,
        flags: featureFlags.getAllFlags(),
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error in migration status API:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
)
