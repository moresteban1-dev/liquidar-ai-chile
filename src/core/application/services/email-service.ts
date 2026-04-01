import { EmailPort, EmailPayload } from '@app/ports/EmailPort';

export class EmailService {
    constructor(private emailPort: EmailPort) { }

    async sendEmail(payload: EmailPayload): Promise<boolean> {
        return this.emailPort.sendEmail(payload);
    }

    async sendQuotationApprovalRequest(clientEmail: string, orderCode: string, quoteUrl: string): Promise<boolean> {
        return this.emailPort.sendQuotationApprovalRequest(clientEmail, orderCode, quoteUrl);
    }

    async sendPaymentConfirmation(clientEmail: string, orderCode: string, dashboardUrl: string): Promise<boolean> {
        return this.emailPort.sendPaymentConfirmation(clientEmail, orderCode, dashboardUrl);
    }

    async sendAdminNotification(subject: string, message: string): Promise<boolean> {
        return this.emailPort.sendAdminNotification(subject, message);
    }
}
