import { EventProcessor } from './EventProcessor'
import {
  OrderCreatedNotificationHandler,
  QuotationSentNotificationHandler,
  QuotationApprovedNotificationHandler,
  QuotationRejectedNotificationHandler,
  OrderStateChangedNotificationHandler
} from './handlers/NotificationEventHandler'
import { getContainer } from '@/infrastructure/di/Container'
import { DI_KEYS } from '@/infrastructure/di/DIKeys'

export async function setupEventHandlers(processor: EventProcessor): Promise<void> {
  const container = await getContainer();
  const notificationService = await container.resolve<any>(DI_KEYS.NotificationService);
  const logger = await container.resolve<any>(DI_KEYS.Logger);
  const cacheManager = await container.resolve<any>(DI_KEYS.CacheManager);

  // ── Notification Handlers ───────────────────────────
  processor.on('OrderCreated', new OrderCreatedNotificationHandler(notificationService))
  processor.on('QuotationSent', new QuotationSentNotificationHandler(notificationService))
  processor.on('QuotationApproved', new QuotationApprovedNotificationHandler(notificationService))
  processor.on('QuotationRejected', new QuotationRejectedNotificationHandler(notificationService))
  processor.on('OrderStateChanged', new OrderStateChangedNotificationHandler(notificationService))

  // ── Cache Invalidation ──────────────────────────────
  const { CacheInvalidationHandler } = require('./handlers/CacheInvalidationHandler')

  const eventsToInvalidate = [
    'OrderCreated', 
    'OrderStateChanged', 
    'ProviderAssignedToOrder',
    'QuotationSubmitted',
    'QuotationSent',
    'QuotationApproved',
    'QuotationRejected'
  ]

  for (const event of eventsToInvalidate) {
    processor.on(event, new CacheInvalidationHandler(cacheManager, logger, event))
  }
}
