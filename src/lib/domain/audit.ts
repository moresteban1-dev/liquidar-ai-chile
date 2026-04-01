
/**
 * Audit Log Domain Service
 * Records critical state changes for financial compliance.
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { OrderState } from '@/types/order';
import { createServiceRoleClient } from '@/lib/supabase/api';

export interface AuditLogEntry {
    orderId: string;
    fromState: OrderState;
    toState: OrderState;
    actorId: string; // User ID or 'SYSTEM'
    reason: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

/**
 * Logs a state transition to the persistent audit log.
 * Currently uses Console, but must be swapped for DB Insert in production.
 */
export async function logOrderTransition(entry: AuditLogEntry): Promise<void> {
    const supabase = createServiceRoleClient();

    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                order_id: entry.orderId,
                from_state: entry.fromState,
                to_state: entry.toState,
                actor_id: entry.actorId,
                reason: entry.reason,
                metadata: entry.metadata || {},
                created_at: entry.timestamp.toISOString(),
            });

        if (error) {
            logger.error('[AUDIT_ERROR] Failed to persist audit log:', error);
            // Fallback to console for traceability
            logger.warn(`[AUDIT_FALLBACK] Order ${entry.orderId}: ${entry.fromState} -> ${entry.toState} by ${entry.actorId}. Reason: ${entry.reason}`);
        } else {
            console.info(`[AUDIT] Order ${entry.orderId} transition logged successfully.`);
        }
    } catch (err) {
        logger.error('[AUDIT_FATAL] Unexpected error logging audit:', err);
    }
}
