import { NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/di/Container';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { withAuth } from '@/lib/api/with-auth';

export const GET = withAuth(async (_request, _user) => {
  try {
    const container = await getContainer();
    const notificationService = await container.resolve<any>('NotificationService');
    
    // El servicio ya devuelve el formato correcto o un mock saludable definido en el Container
    const notifications = await notificationService.getNotifications();
    return NextResponse.json(notifications);
  } catch (error) {
    logger.error('Error en /api/client/notifications:', error as Error);
    return NextResponse.json(
      { error: 'Error al cargar notificaciones' },
      { status: 500 }
    );
  }
});
