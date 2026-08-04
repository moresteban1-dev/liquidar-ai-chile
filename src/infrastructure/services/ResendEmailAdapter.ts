import { EmailPort, EmailPayload } from '@app/ports/EmailPort';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

export class ResendEmailAdapter implements EmailPort {
    private readonly apiKey = process.env.RESEND_API_KEY;
    private readonly fromEmail = process.env.NEXT_PUBLIC_SENDER_EMAIL || 'no-reply@liquidar.cl';

    async sendEmail(payload: EmailPayload): Promise<boolean> {
        try {
            if (!this.apiKey) {
                logger.info('[ResendEmailAdapter: Sandbox] Simulating email send:', {
                    to: payload.to,
                    subject: payload.subject,
                    preview: payload.text || 'HTML Content',
                });
                return true;
            }

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: Array.isArray(payload.to) ? payload.to : [payload.to],
                    subject: payload.subject,
                    html: payload.html,
                    text: payload.text,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                logger.error('[ResendEmailAdapter] Resend API Error:', errorData);
                return false;
            }

            logger.info(`[ResendEmailAdapter] Email successfully sent to ${payload.to}`, { subject: payload.subject });
            return true;
        } catch (error) {
            logger.error('[ResendEmailAdapter] Failed to send email:', error);
            return false;
        }
    }

    async sendQuotationApprovalRequest(clientEmail: string, orderCode: string, quoteUrl: string): Promise<boolean> {
        return this.sendEmail({
            to: clientEmail,
            subject: `Tu Cotización #${orderCode} ha sido Aprobada`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>¡Excelentes noticias!</h2>
                    <p>Tu solicitud de cotización para el evento <strong>#${orderCode}</strong> ha sido aprobada por un proveedor.</p>
                    <p>Puedes revisar los precios y realizar el pago en el siguiente enlace:</p>
                    <a href="${quoteUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Cotización</a>
                    <p>Si tienes alguna duda, responde a este correo.</p>
                </div>
            `,
            text: `Tu cotización #${orderCode} ha sido aprobada. Revísala aquí: ${quoteUrl}`,
        });
    }

    async sendPaymentConfirmation(clientEmail: string, orderCode: string, dashboardUrl: string): Promise<boolean> {
        return this.sendEmail({
            to: clientEmail,
            subject: `Confirmación de Pago - Orden #${orderCode}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>¡Pago Recibido!</h2>
                    <p>Hemos recibido el pago de tu orden <strong>#${orderCode}</strong> exitosamente.</p>
                    <p>Los proveedores ya han sido notificados y comenzarán a trabajar en base a las fechas acordadas.</p>
                    <a href="${dashboardUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Estado del Pedido</a>
                </div>
            `,
            text: `El pago para la orden #${orderCode} fue recibido. Puedes ver su estado en tu panel: ${dashboardUrl}`,
        });
    }

    async sendAdminNotification(subject: string, message: string): Promise<boolean> {
        const adminEmail = process.env.ADMIN_ALERT_EMAIL;
        if (!adminEmail) {
            logger.warn('[ResendEmailAdapter] No ADMIN_ALERT_EMAIL configured.');
            return false;
        }

        return this.sendEmail({
            to: adminEmail,
            subject: `[Admin Alert] ${subject}`,
            html: `<p>${message}</p>`
        });
    }
}
