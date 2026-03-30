import { NotificationPort, CreateNotificationInput } from '@app/ports/NotificationPort';

export class NotificationService {
    constructor(private notificationPort: NotificationPort) { }

    async getNotifications(userId: string, options?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
        return this.notificationPort.getNotifications(userId, options);
    }

    async createNotification(input: CreateNotificationInput): Promise<boolean> {
        const result = await this.notificationPort.createNotification(input);
        return result.isSuccess();
    }

    // Status Change Templates (Pure Application logic calling the port)
    private static STATUS_TEMPLATES: Record<string, {
        title: string;
        message: (code: string) => string;
        icon: string;
        priority: 'NORMAL' | 'HIGH' | 'URGENT';
    }> = {
        PENDING_PROVIDER_BID: {
            title: '🔍 En Proceso',
            message: (code) => `Tu cotización ${code} está siendo trabajada y evaluada por nuestros profesionales.`,
            icon: '🔍',
            priority: 'NORMAL',
        },
        PENDING_ADMIN_APPROVAL: {
            title: '📋 Preparando tu cotización',
            message: (code) => `Estamos revisando las propuestas para tu cotización ${code}. ¡Ya casi está lista!`,
            icon: '📋',
            priority: 'NORMAL',
        },
        AWAITING_CLIENT_PAYMENT: {
            title: '✅ ¡Cotización lista!',
            message: (code) => `Tu cotización ${code} está lista para revisión. Revisa los detalles y confirma tu evento.`,
            icon: '✅',
            priority: 'HIGH',
        },
        APPROVED: {
            title: '🎉 ¡Evento confirmado!',
            message: (code) => `¡Excelente! Tu evento ${code} ha sido confirmado.`,
            icon: '🎉',
            priority: 'HIGH',
        },
        COMPLETED: {
            title: '🏁 Evento completado',
            message: (code) => `Tu evento ${code} ha sido completado. ¡Cuéntanos tu experiencia!`,
            icon: '🏁',
            priority: 'NORMAL',
        },
    };

    async notifyQuotationStatusChange(
        quotationId: string,
        clientUserId: string,
        newStatus: string,
        quotationCode: string,
    ): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const template = (NotificationService.STATUS_TEMPLATES as any)[newStatus];
        if (!template) return;

        await this.notificationPort.createNotification({
            userId: clientUserId,
            title: template.title,
            message: template.message(quotationCode),
            type: 'QUOTATION_STATUS',
            referenceType: 'QUOTATION',
            referenceId: quotationId,
            actionUrl: `/client/quotations/${quotationId}`,
            actionLabel: 'Ver Cotización',
            icon: template.icon,
            priority: template.priority,
        });
    }

    async markAsRead(notificationId: string, userId: string) {
        return this.notificationPort.markAsRead(notificationId, userId);
    }

    async markAllAsRead(userId: string) {
        return this.notificationPort.markAllAsRead(userId);
    }
}
