import { QuoteSession, QuoteItemRequested } from '@core/domain/quote/QuoteTypes';
import { Result } from '@core/shared/Result';

/**
 * IQuoteSessionRepository
 * 
 * Puerto para la persistencia de Sesiones de Cotización (RFQ V2).
 */
export interface IQuoteSessionRepository {
  /**
   * Guarda o actualiza una sesión de cotización.
   * Retorna el ID de la sesión.
   */
  save(session: QuoteSession): Promise<Result<string, string>>;

  /**
   * Agrega ítems solicitados a una sesión.
   */
  addItems(sessionId: string, items: QuoteItemRequested[]): Promise<Result<void, string>>;

  /**
   * Recupera una sesión por su ID, incluyendo sus ítems.
   */
  findById(id: string): Promise<Result<QuoteSession | null, string>>;

  /**
   * Lista todas las sesiones de cotización (RFQs).
   */
  listAll(filters?: { status?: string, segment?: string }): Promise<Result<QuoteSession[], string>>;
}
