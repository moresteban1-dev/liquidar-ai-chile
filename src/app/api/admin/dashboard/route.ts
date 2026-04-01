import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/di/Container';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { adminRoute, MiddlewareContext } from '@/infrastructure/http/middleware/compose';

export const GET = adminRoute(async (_req: NextRequest, _ctx: MiddlewareContext) => {
  try {
    const container = await getContainer();
    const handler = await container.resolve<any>('AdminDashboardHandler');
    
    const stats = await handler.execute();

    if (stats.isErr()) {
        return NextResponse.json({ error: stats.error.message }, { status: 500 });
    }

    return NextResponse.json(stats.value);
  } catch (error) {
    logger.error('Error en Admin Dashboard API:', error as Error);
    return NextResponse.json(
      { error: 'Error al cargar estadísticas del dashboard' },
      { status: 500 }
    );
  }
});
