import crypto from 'crypto'
import { EventHandler } from '../EventProcessor'
import { INotificationService } from '@/core/application/ports/INotificationService';
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

export class OrderCreatedNotificationHandler implements EventHandler {
  readonly eventType = 'OrderCreated'
  
  constructor(private readonly notificationService: INotificationService) {}

  async handle(payload: Record<string, unknown>): Promise<void> {
    const orderId = payload['aggregateId'] as string;
    
    await this.notificationService.notify({
      eventId: (payload['id'] as string) || crypto.randomUUID(),
      eventType: 'ORDER_CREATED_CLIENT',
      channel: 'email',
      recipients: [
        { 
          id: payload['clientId'] as string, 
          email: payload['clientEmail'] as string, 
          name: payload['clientName'] as string 
        }
      ],
      payload: {
        orderId,
        clientName: payload['clientName'] as string,
        total: payload['total'] as number
      }
    });
  }
}

export class QuotationSentNotificationHandler implements EventHandler {
  readonly eventType = 'QuotationSent'
  constructor(private readonly _notificationService: INotificationService) {
    void this._notificationService;
  }

  async handle(payload: Record<string, unknown>): Promise<void> {
    logger.info('QuotationSent notification routing...', { quotationId: payload['aggregateId'] });
    // TODO: Implement in notification router if needed
  }
}

export class QuotationApprovedNotificationHandler implements EventHandler {
  readonly eventType = 'QuotationApproved'
  constructor(private readonly _notificationService: INotificationService) {
    void this._notificationService;
  }

  async handle(payload: Record<string, unknown>): Promise<void> {
    logger.info('QuotationApproved notification routing...', { quotationId: payload['aggregateId'] });
  }
}

export class QuotationRejectedNotificationHandler implements EventHandler {
  readonly eventType = 'QuotationRejected'
  constructor(private readonly _notificationService: INotificationService) {
    void this._notificationService;
  }

  async handle(payload: Record<string, unknown>): Promise<void> {
    logger.info('QuotationRejected notification routing...', { quotationId: payload['aggregateId'] });
  }
}

export class OrderStateChangedNotificationHandler implements EventHandler {
  readonly eventType = 'OrderStateChanged'
  constructor(private readonly _notificationService: INotificationService) {
    void this._notificationService;
  }

  async handle(payload: Record<string, unknown>): Promise<void> {
    logger.info('OrderStateChanged notification routing...', { 
      orderId: payload['aggregateId'], 
      toState: payload['toState'] 
    });
  }
}
