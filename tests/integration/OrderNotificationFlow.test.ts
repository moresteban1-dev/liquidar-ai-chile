import { SupabaseEventPublisher } from '@/infrastructure/events/SupabaseEventPublisher'
import { NotifyClientOnOrderUpdateHandler, NotifyOrderUpdateCommand } from '@/core/application/handlers/NotifyClientOnOrderUpdateHandler'
import { EmailService } from '@/infrastructure/notifications/EmailService'
import { WebhookService } from '@/infrastructure/notifications/WebhookService'
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger'
import { DomainEvent } from '@/core/shared/DomainEvent'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'

describe('OrderNotificationFlow Integration', () => {
  let mockSupabase: any
  let mockEmailService: any
  let mockWebhookService: any
  let logger: StructuredLogger
  let eventPublisher: SupabaseEventPublisher
  let notificationHandler: NotifyClientOnOrderUpdateHandler

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null })
    }

    mockEmailService = {
      send: vi.fn().mockResolvedValue(true)
    }

    mockWebhookService = {
      send: vi.fn().mockResolvedValue(true)
    }

    logger = StructuredLogger.create({ component: 'test' })
    eventPublisher = new SupabaseEventPublisher(mockSupabase, logger)
    notificationHandler = new NotifyClientOnOrderUpdateHandler(mockEmailService, mockWebhookService)
  })

  it('should persist event to outbox when published', async () => {
    class TestOrderUpdatedEvent extends DomainEvent {
      constructor(private readonly aggregateIdValue: UniqueEntityID) {
        super();
      }
      getAggregateId(): UniqueEntityID {
        return this.aggregateIdValue;
      }
    }

    const event = new TestOrderUpdatedEvent(new UniqueEntityID('order-123'));

    await eventPublisher.publish(event)

    expect(mockSupabase.from).toHaveBeenCalledWith('event_outbox')
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        event_type: 'TestOrderUpdatedEvent',
        aggregate_id: 'order-123'
      })
    ])
  })

  it('should trigger both email and webhook when notification handler is executed', async () => {
    const command: NotifyOrderUpdateCommand = {
      orderId: 'order-456',
      newStatus: 'delivered',
      clientName: 'Juan Perez',
      clientEmail: 'juan@example.com',
      total: 1500
    }

    const result = await notificationHandler.execute(command)

    expect(result.isSuccess()).toBe(true)
    expect(mockEmailService.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'juan@example.com',
      subject: expect.stringContaining('order-45')
    }))
    expect(mockWebhookService.send).toHaveBeenCalledWith(expect.objectContaining({
      event: 'order.updated',
      data: expect.objectContaining({ orderId: 'order-456' })
    }))
  })
})
