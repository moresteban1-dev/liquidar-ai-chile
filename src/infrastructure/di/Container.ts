// src/infrastructure/di/Container.ts
import { SupabaseCatalogRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseCatalogRepository';
import { CatalogItemMapper } from '@/infrastructure/persistence/supabase/mappers/CatalogItemMapper';
import { CatalogCategoryMapper } from '@/infrastructure/persistence/supabase/mappers/CatalogCategoryMapper';
import { createClient } from '@supabase/supabase-js';

type Factory<T> = () => T | Promise<T>;

interface RegistrationOptions {
  singleton?: boolean;
}

interface Registration<T> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
  loading?: Promise<T>;
}

export const DI_KEYS = {
  SupabaseClient: 'SupabaseClient',
  CatalogRepository: 'CatalogRepository',
  Logger: 'Logger',
  CacheManager: 'CacheManager',
  NegotiatorAgent: 'NegotiatorAgent',
  QASentinelAgent: 'QASentinelAgent',
  EmailService: 'EmailService',
  NotificationService: 'NotificationService',
  OrderRepository: 'OrderRepository',
  QuotationRepository: 'QuotationRepository',
  PlatformConfigRepository: 'PlatformConfigRepository',
  CatalogService: 'CatalogService',
  KnowledgeRepository: 'KnowledgeRepository',
  QuotationHistoryRepository: 'QuotationHistoryRepository',
  CreateOrderHandler: 'CreateOrderHandler',
  CreateQuotationHandler: 'CreateQuotationHandler',
  AssignProviderHandler: 'AssignProviderHandler',
  CreateQuotationRequestHandler: 'CreateQuotationRequestHandler',
  EventBus: 'EventBus',
  AIBroker: 'AIBroker',
  ProviderInventoryRepository: 'ProviderInventoryRepository',
  ProviderInventoryService: 'ProviderInventoryService',
  AIGenerator: 'AIGenerator',
  AIAuditPort: 'AIAuditPort',
  ConfidenceService: 'ConfidenceService',
  PricingCalculatorService: 'PricingCalculatorService',
  SLAService: 'SLAService',
  MarketingGeniusAgent: 'MarketingGeniusAgent',
  PricingOracleAgent: 'PricingOracleAgent',
  SLAGuardianAgent: 'SLAGuardianAgent',
  InternalCommandBus: 'InternalCommandBus',
} as const;

export class Container {
  private registrations = new Map<string, Registration<any>>();

  register<T>(key: string, factory: Factory<T>, options: RegistrationOptions = {}): void {
    this.registrations.set(key, {
      factory,
      singleton: options.singleton !== false,
      instance: undefined,
      loading: undefined,
    });
  }

  async resolve<T>(key: string): Promise<T> {
    const registration = this.registrations.get(key);

    if (!registration) {
      throw new Error(`[DI] Dependency "${key}" not registered. Registration map size: ${this.registrations.size}`);
    }

    if (registration.singleton && registration.instance !== undefined) {
      return registration.instance;
    }

    if (registration.singleton && registration.loading) {
      return registration.loading;
    }

    const loadingPromise = (async () => {
      try {
        const result = registration.factory();
        const instance = result instanceof Promise ? await result : result;

        if (!instance) {
          throw new Error(`[DI] Factory for "${key}" returned null`);
        }

        if (registration.singleton) {
          registration.instance = instance;
          registration.loading = undefined;
        }

        return instance;
      } catch (error) {
        registration.loading = undefined;
        const msg = `[DI ERROR] Critical failure resolving "${key}": ${error instanceof Error ? error.message : String(error)}`;
        console.error(msg);
        throw new Error(msg);
      }
    })();

    if (registration.singleton) {
      registration.loading = loadingPromise;
    }

    return loadingPromise;
  }

  has(key: string): boolean {
    return this.registrations.has(key);
  }
}

export const container = new Container();

export const getContainer = async (): Promise<Container> => {
    // Si el repositorio no está registrado, ejecutamos el bootstrap estático (SAFE TIER)
    if (!container.has('CatalogRepository')) {
        const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] || '';
        const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';
        
        // Registro Manual/Estático para máxima confiabilidad en Vercel
        container.register('SupabaseClient', () => createClient(url, key), { singleton: true });
        
        container.register('CatalogRepository', async () => {
            const supabase = await container.resolve<any>('SupabaseClient');
            return new SupabaseCatalogRepository(
                supabase, 
                new CatalogItemMapper(), 
                new CatalogCategoryMapper()
            );
        }, { singleton: true });
        
        container.register('Logger', () => console, { singleton: true });

        // Intentar cargar el resto dinámicamente si bindings existe
        try {
            const { registerBindings } = await import('./bindings');
            registerBindings(container);
        } catch (e) {
            console.warn('[DI] Dynamic bindings could not be loaded - relying on Static Tier only');
        }
    }
    return container;
};
