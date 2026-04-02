/**
 * Standard Action Response — Identity Fortress
 * 
 * Consistent response structure for all Server Actions and API Handlers.
 */
export interface ActionResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    metadata?: Record<string, unknown>;
}
