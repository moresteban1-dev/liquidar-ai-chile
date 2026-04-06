/**
 * Audit Logger — Identity Fortress
 * 
 * Records security-sensitive actions in the database.
 */

import { createServiceRoleClient } from '@/lib/supabase/api';
import { logger } from '@/infrastructure/telemetry/StructuredLogger';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditEvent {
    action: string;
    actor: string; // user.id or 'anonymous'
    target?: string; // target resource or user.id
    ip?: string | null;
    userAgent?: string | null;
    severity?: AuditSeverity;
    metadata?: Record<string, any>;
}

/**
 * Logs a security event to the audit_logs table
 */
export async function logSecurityEvent(event: AuditEvent) {
    const supabase = createServiceRoleClient();

    try {
        const { error } = await supabase.from('audit_logs').insert({
            action: event.action,
            actor: event.actor,
            target: event.target,
            ip_address: event.ip,
            user_agent: event.userAgent,
            severity: event.severity || 'LOW',
            metadata: event.metadata || {},
            timestamp: new Date().toISOString(),
        });

        if (error) {
            console.error('[AUDIT] Failed to insert log:', error);
        }

        // Potential: Send Slack/Webhook alert for HIGH/CRITICAL
        if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
            await sendSecurityAlert(event);
        }
    } catch (err) {
        console.error('[AUDIT] Unexpected logger error:', err);
    }
}

async function sendSecurityAlert(event: AuditEvent) {
    // Structured logging for security alerts
    logger.warn(`[SECURITY ALERT] ${event.severity}: ${event.action} by ${event.actor}`, {
        severity: event.severity,
        action: event.action,
        actor: event.actor,
        target: event.target,
        ip: event.ip
    });
}
