export interface EventHandler<T> {
    handle(event: T): Promise<void>;
}
import { QuotationStatusChanged, QuotationBidReceived } from '../../domain/events/quotation/events';
import { NotificationService } from '../services/notification.service';
import { EmailService } from '../services/email-service';
import { QuotationRepository } from '@app/ports/QuotationRepository';
import { Logger } from '@core/domain/ports/Logger';

export class QuotationNotificationHandler implements EventHandler<QuotationStatusChanged | QuotationBidReceived> {
    constructor(
        private quotationRepository: QuotationRepository,
        private notificationService: NotificationService,
        private emailService: EmailService,
        private logger: Logger
    ) { }

    async handle(event: QuotationStatusChanged | QuotationBidReceived): Promise<void> {
        if (event instanceof QuotationStatusChanged) {
            await this.handleStatusChange(event);
        } else if (event instanceof QuotationBidReceived) {
            await this.handleBidReceived(event);
        }
    }

    private async handleStatusChange(event: QuotationStatusChanged): Promise<void> {
        this.logger.info(`Handling QuotationStatusChanged for ${event.quotationId}`, { newStatus: event.newStatus });

        // 1. In-platform Notification
        await this.notificationService.notifyQuotationStatusChange(
            event.quotationId,
            event.clientId,
            event.newStatus,
            event.quotationCode
        );

        // 2. Email Notification (Specific statuses)
        if (event.newStatus === 'AWAITING_CLIENT_PAYMENT') {
            // In a real scenario, the repository would provide the email
            // For now, we assume the system can resolve it or we evolve the event to include it
            const emailResult = await this.quotationRepository.getClientEmail(event.clientId);
            if (emailResult.isSuccess() && emailResult.getValue()) {
                const clientEmail = emailResult.getValue()!;
                const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/client/quotations/${event.quotationId}`;
                await this.emailService.sendQuotationApprovalRequest(clientEmail, event.quotationCode, quoteUrl);
            }
        }
    }

    private async handleBidReceived(event: QuotationBidReceived): Promise<void> {
        this.logger.info(`Handling QuotationBidReceived for ${event.quotationId} from ${event.providerId}`);
        
        // Notify Admin that a new bid is ready for review
        await this.emailService.sendAdminNotification(
            `Nueva propuesta para Cotización ${event.quotationId}`,
            `El proveedor ${event.providerId} ha enviado una propuesta por $${event.bidAmount}. Favor revisar en el panel de administración.`
        );
    }
}
