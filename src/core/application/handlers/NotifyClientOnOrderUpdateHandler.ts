import { InstrumentedHandler } from '@/core/application/shared/InstrumentedHandler'
import { Result, Success } from '@/core/shared/Result'
import { AppError } from '@/core/shared/AppError'
import { IEmailProvider, IWebhookProvider } from '../ports/INotificationProvider'
import { EmailTemplates } from '@/core/domain/templates/EmailTemplates'

export interface NotifyOrderUpdateCommand {
  orderId: string
  newStatus: string
  clientName: string
  clientEmail: string
  total: number
}

/**
 * NotifyClientOnOrderUpdateHandler
 * 
 * Orchestrates external notifications (Email + Webhook)
 * when an order status changes.
 */
export class NotifyClientOnOrderUpdateHandler extends InstrumentedHandler<NotifyOrderUpdateCommand, void> {
  protected handlerName = 'NotifyClientOnOrderUpdateHandler'
  protected operationType = 'command' as const

  constructor(
    private readonly emailService: IEmailProvider,
    private readonly webhookService: IWebhookProvider
  ) {
    super()
  }

  protected async handle(command: NotifyOrderUpdateCommand): Promise<Result<void, AppError>> {
    const { orderId, newStatus, clientName, clientEmail, total } = command

    // 1. Send Email Notification
    const emailSent = await this.emailService.send({
      to: clientEmail,
      subject: `Actualización de pedido #${orderId.slice(0, 8)}`,
      html: EmailTemplates.orderUpdate(orderId, newStatus, clientName)
    })

    if (!emailSent) {
      // Logic for logging is handled by services, but we can add context here
    }

    // 2. Trigger N8N Webhook (Business Process)
    const webhookSent = await this.webhookService.send({
      event: 'order.updated',
      timestamp: new Date().toISOString(),
      data: {
        orderId,
        status: newStatus,
        client: { name: clientName, email: clientEmail },
        total
      }
    })

    if (!webhookSent) {
      // Logic for logging is handled by services
    }

    return new Success(undefined)
  }

  protected extractSpanAttributes(command: NotifyOrderUpdateCommand): Record<string, string | number | boolean> {
    return {
      'order.id': command.orderId,
      'order.status': command.newStatus,
      'client.email': command.clientEmail
    }
  }
}
