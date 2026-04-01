import { EventHandler } from '../EventProcessor'
import { CacheManager } from '@/infrastructure/cache/CacheManager';
import { InvalidationPatterns } from '@/infrastructure/cache/CacheKeyBuilder';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';

/**
 * Generic cache invalidation handler that implements the EventHandler interface.
 * Can be registered for multiple event types.
 */
export class CacheInvalidationHandler implements EventHandler {
  constructor(
    private readonly cache: CacheManager,
    private readonly logger: StructuredLogger,
    public readonly eventType: string
  ) {}

  async handle(payload: Record<string, unknown>): Promise<void> {
    const patterns = this.resolvePatterns(this.eventType, payload);

    if (patterns.length === 0) return;

    let totalInvalidated = 0;
    for (const pattern of patterns) {
      totalInvalidated += this.cache.invalidateByPrefix(pattern);
    }

    if (totalInvalidated > 0) {
      this.logger.debug('Cache invalidated by domain event', {
        eventType: this.eventType,
        patterns,
        totalInvalidated,
      });
    }
  }

  private resolvePatterns(eventType: string, payload: Record<string, unknown>): string[] {
    // In our system, aggregateId is usually the primary entity ID
    const aggregateId = (payload['aggregateId'] || payload['id']) as string;
    
    switch (eventType) {
      case 'OrderCreated':
        return InvalidationPatterns.orderChanged(
          aggregateId,
          payload['clientId'] as string,
        );

      case 'OrderStateChanged':
        return InvalidationPatterns.orderChanged(
          aggregateId,
          payload['clientId'] as string,
          payload['providerId'] as string | undefined,
        );

      case 'ProviderAssignedToOrder':
        return InvalidationPatterns.orderChanged(
          aggregateId,
          (payload['clientId'] as string) ?? '',
          payload['providerId'] as string,
        );

      case 'QuotationSubmitted':
      case 'QuotationSent':
      case 'QuotationApproved':
      case 'QuotationRejected':
        // Quotation events usually have orderId in payload
        return InvalidationPatterns.quotationChanged(
          payload['orderId'] as string,
          payload['providerId'] as string,
        );

      default:
        return [];
    }
  }
}
