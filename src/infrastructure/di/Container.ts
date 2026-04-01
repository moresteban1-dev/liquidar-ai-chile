// src/infrastructure/di/Container.ts
// Container de Inyección de Dependencias con LAZY LOADING

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

/**
 * Constantes para evitar typos al resolver dependencias
 * [BACKWARD COMPATIBILITY]
 */
export const DI_KEYS = {
  SupabaseClient: 'SupabaseClient',
  CatalogRepository: 'CatalogRepository',
  OrderRepository: 'OrderRepository',
  QuotationRepository: 'QuotationRepository',
  KnowledgeRepository: 'KnowledgeRepository',
  EventBus: 'EventBus',
  CreateOrderHandler: 'CreateOrderHandler',
  AIBroker: 'AIBroker',
  CacheManager: 'CacheManager',
  ProviderInventoryService: 'ProviderInventoryService',
  Logger: 'Logger',
  EmailService: 'EmailService',
  NotificationService: 'NotificationService',
  AIGenerator: 'AIGenerator',
  NegotiatorAgent: 'NegotiatorAgent',
  QASentinelAgent: 'QASentinelAgent',
  AIAuditPort: 'AIAuditPort',
  ConfidenceService: 'ConfidenceService',
  MarketingGeniusAgent: 'MarketingGeniusAgent',
  PricingOracleAgent: 'PricingOracleAgent',
  SLAGuardianAgent: 'SLAGuardianAgent',
  PlatformConfigRepository: 'PlatformConfigRepository',
  CatalogService: 'CatalogService',
  PricingCalculatorService: 'PricingCalculatorService',
  SLAService: 'SLAService',
} as const;

/**
 * Container de Inyección de Dependencias con soporte para:
 * - Lazy Loading (imports dinámicos)
 * - Singletons
 * - Resolución asíncrona
 * 
 * Diseñado para ser compatible con Vercel Edge Runtime
 */
export class Container {
  private registrations = new Map<string, Registration<any>>();

  /**
   * Registra una factory LAZY (no se ejecuta hasta resolve)
   */
  register<T>(
    key: string,
    factory: Factory<T>,
    options: RegistrationOptions = {}
  ): void {
    this.registrations.set(key, {
      factory,
      singleton: options.singleton !== false, // Default: true
      instance: undefined,
      loading: undefined,
    });
  }

  /**
   * Resuelve una dependencia de forma ASÍNCRONA
   * Solo instancia cuando se llama (lazy)
   */
  async resolve<T>(key: string): Promise<T> {
    const registration = this.registrations.get(key);

    if (!registration) {
      console.error(`[Container] No registration found for key: "${key}"`);
      return null as any;
    }

    // Si es singleton ya está instanciado, retornar
    if (registration.singleton && registration.instance !== undefined) {
      return registration.instance;
    }

    // Si ya está cargando (evitar race conditions), esperar
    if (registration.singleton && registration.loading) {
      return registration.loading;
    }

    // Ejecutar factory
    const loadingPromise = (async () => {
      try {
        const result = registration.factory();
        const instance = result instanceof Promise ? await result : result;

        // Guardar instancia si es singleton
        if (registration.singleton) {
          registration.instance = instance;
          registration.loading = undefined;
        }

        return instance;
      } catch (error) {
        registration.loading = undefined;
        console.error(`[Container] Failed to resolve "${key}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null as any;
      }
    })();

    // Guardar promise para evitar race conditions
    if (registration.singleton) {
      registration.loading = loadingPromise;
    }

    return loadingPromise;
  }

  /**
   * Resuelve SÍNCRONAMENTE (solo para instancias ya cargadas)
   */
  resolveSync<T>(key: string): T {
    const registration = this.registrations.get(key);

    if (!registration) {
      console.error(`[Container] No registration found for key: "${key}"`);
      return null as any;
    }

    if (registration.instance === undefined) {
      console.error(`[Container] Instance for "${key}" not ready. Use resolve() for async resolution.`);
      return null as any;
    }

    return registration.instance;
  }

  /**
   * Verifica si una dependencia está registrada
   */
  has(key: string): boolean {
    return this.registrations.has(key);
  }

  /**
   * Verifica si una dependencia ya está instanciada
   */
  isResolved(key: string): boolean {
    const registration = this.registrations.get(key);
    return registration?.instance !== undefined;
  }

  /**
   * Pre-carga servicios críticos (warm-up)
   */
  async warmUp(keys: string[]): Promise<void> {
    const results = await Promise.allSettled(
      keys.map(key => this.resolve(key))
    );

    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected'
    );

    if (failures.length > 0) {
      console.error('[Container] Warm-up failures:', failures.map(f => f.reason));
    }
  }

  /**
   * Limpia todas las instancias (útil para testing)
   */
  clear(): void {
    for (const registration of this.registrations.values()) {
      registration.instance = undefined;
      registration.loading = undefined;
    }
  }

  /**
   * Resetea completamente el container
   */
  reset(): void {
    this.registrations.clear();
  }
}

// Singleton global del container
export const container = new Container();

// Helper para compatibilidad con código que usa getContainer
export const getContainer = async () => container;
