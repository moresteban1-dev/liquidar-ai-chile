
/**
 * Logger Port
 * 
 * Interfaz canónica para el sistema de logs en la capa de aplicación.
 */
export interface Logger {
    info(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: unknown, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    debug(message: string, context?: Record<string, unknown>): void;
}
