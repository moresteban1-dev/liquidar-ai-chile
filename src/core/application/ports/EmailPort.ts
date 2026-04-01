export interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export interface EmailPort {
    sendEmail(payload: EmailPayload): Promise<boolean>;
    sendQuotationApprovalRequest(clientEmail: string, orderCode: string, quoteUrl: string): Promise<boolean>;
    sendPaymentConfirmation(clientEmail: string, orderCode: string, dashboardUrl: string): Promise<boolean>;
    sendAdminNotification(subject: string, message: string): Promise<boolean>;
}
