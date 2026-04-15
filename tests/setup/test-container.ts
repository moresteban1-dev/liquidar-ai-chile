/**
 * Creates a fully wired DI container for integration tests.
 * Uses real implementations where possible, mocks for external I/O.
 */

import { Container } from '@/infrastructure/di/Container';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { MetricsCollectorImpl } from '@/infrastructure/telemetry/MetricsCollector';
import { TemplateEngine } from '@/infrastructure/notifications/email/TemplateEngine';
import { ORDER_TEMPLATES } from '@/infrastructure/notifications/templates/order-templates';
import { QUOTATION_TEMPLATES } from '@/infrastructure/notifications/templates/quotation-templates';
import { SYSTEM_TEMPLATES } from '@/infrastructure/notifications/templates/system-templates';
import { InMemoryOrderRepository } from '../mocks/InMemoryOrderRepository';
import { InMemoryQuotationRepository } from '../mocks/InMemoryQuotationRepository';
import { InMemoryEventPublisher } from '../mocks/InMemoryEventPublisher';
import { InMemoryNotificationLog } from '../mocks/InMemoryNotificationLog';
import { NotificationRouter } from '@/infrastructure/notifications/NotificationRouter';

export interface TestContainer {
  container: Container;
  orderRepo: InMemoryOrderRepository;
  quotationRepo: InMemoryQuotationRepository;
  eventPublisher: InMemoryEventPublisher;
  notificationLog: InMemoryNotificationLog;
  logger: StructuredLogger;
  metrics: MetricsCollectorImpl;
  templateEngine: TemplateEngine;
  notificationRouter: NotificationRouter;
}

export function createTestContainer(): TestContainer {
  const container = new Container();

  // Logger
  const logger = new StructuredLogger('test');

  const metrics = new MetricsCollectorImpl(logger);

  // In-memory repositories
  const orderRepo = new InMemoryOrderRepository();
  const quotationRepo = new InMemoryQuotationRepository();
  const eventPublisher = new InMemoryEventPublisher();
  const notificationLog = new InMemoryNotificationLog();

  // Template engine
  const templateEngine = new TemplateEngine();
  templateEngine.registerAll(ORDER_TEMPLATES);
  templateEngine.registerAll(QUOTATION_TEMPLATES);
  templateEngine.registerAll(SYSTEM_TEMPLATES);

  // Notification Router
  const notificationRouter = new NotificationRouter({ logger });

  // Register all
  container.register('logger', () => logger, { singleton: true });
  container.register('metrics', () => metrics, { singleton: true });
  container.register('orderRepository', () => orderRepo, { singleton: true });
  container.register('quotationRepository', () => quotationRepo, { singleton: true });
  container.register('eventPublisher', () => eventPublisher, { singleton: true });
  container.register('notificationLog', () => notificationLog, { singleton: true });
  container.register('templateEngine', () => templateEngine, { singleton: true });
  container.register('notificationService', () => notificationRouter, { singleton: true });

  return {
    container,
    orderRepo,
    quotationRepo,
    eventPublisher,
    notificationLog,
    logger,
    metrics,
    templateEngine,
    notificationRouter,
  };
}
