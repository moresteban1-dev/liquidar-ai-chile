import { QuoteSession } from '../../domain/quote/QuoteTypes';

export interface QuoteSessionRepository {
    /**
     * Guarda la sesión completa (Lead, Opciones calculadas, Items seleccionados)
     */
    createSession(session: QuoteSession): Promise<QuoteSession>;

    /**
     * Recupera una sesión específica con todas sus dependencias (hijos)
     */
    getSessionById(id: string): Promise<QuoteSession | null>;

    /**
     * Actualiza el estado de la cotización (e.g. DRAFT -> SENT -> ACCEPTED)
     */
    updateSessionStatus(id: string, status: string): Promise<void>;
}
