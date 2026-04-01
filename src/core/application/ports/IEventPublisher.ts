import { DomainEvent } from '@core/shared/DomainEvent';
import { Result } from '@core/shared/Result';

/**
 * IEventPublisher - Port
 * 
 * Contrato para publicación de eventos de dominio
 */

export interface IEventPublisher {
  publish(event: DomainEvent): Promise<Result<void, string>>;
  publishMany(events: DomainEvent[]): Promise<Result<void, string>>;
}
