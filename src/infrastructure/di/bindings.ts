// src/infrastructure/di/bindings.ts
// Registros de dependencias con LAZY LOADING (imports dinámicos)

import { container, Container, DI_KEYS } from './Container';

export { DI_KEYS };

/**
 * Registra todas las dependencias de la aplicación
 * Usa imports DINÁMICOS para evitar bundling de módulos pesados
 */
export function registerBindings(c: Container): void {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 0: INFRASTRUCTURE (Logger, Email, etc.)
  // ═══════════════════════════════════════════════════════════════════════════

  c.register('EmailService', async () => {
    const { EmailService } = await import('@infrastructure/notifications/EmailService');
    const { StructuredLogger } = await import('@/infrastructure/telemetry/StructuredLogger');
    const logger = StructuredLogger.create({ component: 'EmailService' });
    return new EmailService(
      process.env['RESEND_API_KEY'] || '',
      process.env['DEFAULT_FROM_EMAIL'] || 'noreply@dropservice.cl',
      logger
    );
  }, { singleton: true });

  c.register('NotificationService', async () => {
    const { NotificationRouter } = await import('@infrastructure/notifications/NotificationRouter');
    const { StructuredLogger } = await import('@/infrastructure/telemetry/StructuredLogger');
    const logger = StructuredLogger.create({ component: 'NotificationService' });
    const router = new NotificationRouter({ logger });
    
    // Register Email channel
    const emailService = await c.resolve<any>('EmailService');
    // Assuming EmailService implements INotificationChannel for this router
    // Or we might need an adapter. For now, let's assume it works or we'll wrap it.
    router.registerChannel({
        channelType: 'email',
        send: async (n: any) => {
            const validRecipients = n.recipients.filter((r: any) => !!r.email);
            if (validRecipients.length === 0) {
                return { channel: 'email', status: 'skipped', successCount: 0, failureCount: 0, results: [] };
            }

            const success = await emailService.send({
                to: validRecipients.map((r: any) => r.email as string),
                subject: (n.payload && n.payload['subject'] as string) || 'Notification',
                html: (n.payload && n.payload['html'] as string) || '',
                text: n.payload && n.payload['text'] as string
            });

            return {
                channel: 'email',
                status: success ? 'sent' : 'failed',
                successCount: success ? validRecipients.length : 0,
                failureCount: success ? 0 : validRecipients.length,
                results: validRecipients.map((r: any) => ({
                    recipientId: r.id,
                    recipientEmail: r.email,
                    status: success ? 'sent' : 'failed'
                }))
            };
        }
    });
    
    return router;
  }, { singleton: true });

  c.register('Logger', () => {
    // Logger simple que no requiere imports pesados
    return {
      info: (message: string, context?: Record<string, unknown>) => {
        console.log(JSON.stringify({ level: 'INFO', message, ...context, timestamp: new Date().toISOString() }));
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        console.warn(JSON.stringify({ level: 'WARN', message, ...context, timestamp: new Date().toISOString() }));
      },
      error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
        console.error(JSON.stringify({ 
          level: 'ERROR', 
          message, 
          error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
          ...context, 
          timestamp: new Date().toISOString() 
        }));
      },
    };
  }, { singleton: true });

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 2: SUPABASE CLIENT (Lazy loaded)
  // ═══════════════════════════════════════════════════════════════════════════

  c.register('SupabaseClient', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    
    // Usamos variables de entorno seguras (Getters del nuevo env.config)
    const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] || '';
    const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';
    
    return createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }, { singleton: true });

  // Alias para compatibilidad con nombres minúsculos o nombres antiguos
  c.register('supabase', async () => await c.resolve('SupabaseClient'), { singleton: true });

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 3: REPOSITORIES (Lazy loaded con imports dinámicos)
  // ═══════════════════════════════════════════════════════════════════════════

  c.register('CatalogRepository', async () => {
    const { SupabaseCatalogRepository } = await import('@infrastructure/persistence/supabase/repositories/SupabaseCatalogRepository');
    const { CatalogItemMapper } = await import('@infrastructure/persistence/supabase/mappers/CatalogItemMapper');
    const { CatalogCategoryMapper } = await import('@infrastructure/persistence/supabase/mappers/CatalogCategoryMapper');
    const supabase = await c.resolve<any>('SupabaseClient');
    return new SupabaseCatalogRepository(supabase, new CatalogItemMapper(), new CatalogCategoryMapper());
  }, { singleton: true });

  c.register('PlatformConfigRepository', async () => {
    const { SupabasePlatformConfigRepository } = await import('@infrastructure/persistence/supabase/repositories/SupabasePlatformConfigRepository');
    const supabase = await c.resolve<any>('SupabaseClient');
    return new SupabasePlatformConfigRepository(supabase);
  }, { singleton: true });

  c.register('CatalogService', async () => {
    const { CatalogService } = await import('@core/application/services/CatalogService');
    const repo = await c.resolve<any>('CatalogRepository');
    const marketingAgent = await c.resolve<any>('MarketingGeniusAgent');
    const logger = await c.resolve<any>('Logger');
    return new CatalogService(repo, marketingAgent, logger);
  }, { singleton: true });

  c.register('OrderRepository', async () => {
    const { SupabaseOrderRepository } = await import('@infrastructure/persistence/supabase/repositories/SupabaseOrderRepository');
    
    const supabase = await c.resolve<any>('SupabaseClient');
    return new SupabaseOrderRepository(supabase);
  }, { singleton: true });

  c.register('QuotationRepository', async () => {
    const { SupabaseQuotationRepository } = await import('@infrastructure/persistence/supabase/repositories/SupabaseQuotationRepository');
    const supabase = await c.resolve<any>('SupabaseClient');
    return new SupabaseQuotationRepository(supabase);
  }, { singleton: true });

  c.register('KnowledgeRepository', async () => {
    const { SupabaseKnowledgeRepository } = await import('@infrastructure/persistence/supabase/repositories/SupabaseKnowledgeRepository');
    const supabase = await c.resolve<any>('SupabaseClient');
    return new SupabaseKnowledgeRepository(supabase);
  }, { singleton: true });

  // Alias con prefijo 'I' para cumplir con la propuesta del usuario
  c.register('IOrderRepository', async () => await c.resolve('OrderRepository'), { singleton: true });
  c.register('IQuotationRepository', async () => await c.resolve('QuotationRepository'), { singleton: true });
  c.register('ICatalogRepository', async () => await c.resolve('CatalogRepository'), { singleton: true });
  c.register('IKnowledgeRepository', async () => await c.resolve('KnowledgeRepository'), { singleton: true });

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 4: APPLICATION HANDLERS & SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

  c.register('CreateOrderHandler', async () => {
    const { CreateOrderHandler } = await import('@core/application/handlers/CreateOrderHandler');
    const orderRepo = await c.resolve<any>('OrderRepository');
    const eventBus = await c.resolve<any>('EventBus');
    return new CreateOrderHandler(orderRepo, eventBus);
  }, { singleton: true });

  c.register('EventBus', async () => {
    const { SupabaseEventPublisher } = await import('@infrastructure/events/SupabaseEventPublisher');
    const supabase = await c.resolve<any>('SupabaseClient');
    const logger = await c.resolve<any>('Logger');
    return new SupabaseEventPublisher(supabase, logger);
  }, { singleton: true });

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 5: HEAVY DEPENDENCIES (Genkit / AI Broker)
  // ═══════════════════════════════════════════════════════════════════════════

  c.register('AIBroker', async () => {
    const { GenkitAIBrokerAdapter } = await import('@infrastructure/services/GenkitAIBrokerAdapter');
    return new GenkitAIBrokerAdapter();
  }, { singleton: true });

  c.register('ProviderInventoryRepository', async () => {
    const { SupabaseProviderInventoryRepository } = await import('@infrastructure/persistence/supabase/repositories/SupabaseProviderInventoryRepository');
    const supabase = await c.resolve<any>('SupabaseClient');
    return new SupabaseProviderInventoryRepository(supabase);
  }, { singleton: true });

  c.register('ProviderInventoryService', async () => {
    const { ProviderInventoryService } = await import('@core/application/services/ProviderInventoryService');
    const repo = await c.resolve<any>('ProviderInventoryRepository');
    return new ProviderInventoryService(repo);
  }, { singleton: true });

  c.register('AIGenerator', async () => {
    const { VercelAIGenerator } = await import('@infrastructure/ai/VercelAIGenerator');
    return new VercelAIGenerator();
  }, { singleton: true });

  c.register('NegotiatorAgent', async () => {
    const { NegotiatorAgent } = await import('@infrastructure/ai/agents/NegotiatorAgent');
    const logger = await c.resolve<any>('Logger');
    const ai = await c.resolve<any>('AIGenerator');
    const audit = await c.resolve<any>('AIAuditPort');
    return new NegotiatorAgent(logger, ai, audit);
  }, { singleton: true });

  c.register('AIAuditPort', async () => {
    const { SupabaseAIAuditAdapter } = await import('@infrastructure/persistence/supabase/SupabaseAIAuditAdapter');
    return new SupabaseAIAuditAdapter();
  }, { singleton: true });

  c.register('QASentinelAgent', async () => {
    const { QASentinelAgent } = await import('@infrastructure/ai/agents/QASentinelAgent');
    const logger = await c.resolve<any>('Logger');
    const ai = await c.resolve<any>('AIGenerator');
    const audit = await c.resolve<any>('AIAuditPort');
    return new QASentinelAgent(logger, ai, audit);
  }, { singleton: true });

  c.register('ConfidenceService', async () => {
    const { ConfidenceService } = await import('@core/application/services/ConfidenceService');
    return new ConfidenceService();
  }, { singleton: true });

  c.register('PricingCalculatorService', async () => {
    const { PricingCalculatorService } = await import('@core/application/services/PricingCalculatorService');
    const configRepo = await c.resolve<any>('PlatformConfigRepository');
    const pricingAgent = await c.resolve<any>('PricingOracleAgent');
    return new PricingCalculatorService(configRepo, pricingAgent);
  }, { singleton: true });

  c.register('SLAService', async () => {
    const { SLAService } = await import('@core/application/services/SLAService');
    const orderRepo = await c.resolve<any>('OrderRepository');
    const slaAgent = await c.resolve<any>('SLAGuardianAgent');
    const logger = await c.resolve<any>('Logger');
    return new SLAService(orderRepo, slaAgent, logger);
  }, { singleton: true });

  c.register('MarketingGeniusAgent', async () => {
    const { MarketingGeniusAgent } = await import('@infrastructure/ai/agents/MarketingGeniusAgent');
    const logger = await c.resolve<any>('Logger');
    const ai = await c.resolve<any>('AIGenerator');
    const audit = await c.resolve<any>('AIAuditPort');
    return new MarketingGeniusAgent(logger, ai, audit);
  }, { singleton: true });

  c.register('PricingOracleAgent', async () => {
    const { PricingOracleAgent } = await import('@infrastructure/ai/agents/PricingOracleAgent');
    const logger = await c.resolve<any>('Logger');
    const ai = await c.resolve<any>('AIGenerator');
    const audit = await c.resolve<any>('AIAuditPort');
    return new PricingOracleAgent(logger, ai, audit);
  }, { singleton: true });

  c.register('SLAGuardianAgent', async () => {
    const { SLAGuardianAgent } = await import('@infrastructure/ai/agents/SLAGuardianAgent');
    const logger = await c.resolve<any>('Logger');
    const ai = await c.resolve<any>('AIGenerator');
    const audit = await c.resolve<any>('AIAuditPort');
    return new SLAGuardianAgent(logger, ai, audit);
  }, { singleton: true });

  c.register('CacheManager', async () => {
     const { CacheManager } = await import('@infrastructure/cache/CacheManager');
     const { metricsCollector } = await import('@infrastructure/telemetry/MetricsCollector');
     // No importamos logger global aquí para evitar ciclos, usamos el registrado
     const logger = await c.resolve<any>('Logger');
     
     return new CacheManager(logger, metricsCollector, {
        maxEntries: 10000,
        defaultTtlMs: 60000,
     });
  });
}

// Auto-registrar bindings al importar el módulo
registerBindings(container);

// Re-exportar container para uso en la aplicación
export { container };
