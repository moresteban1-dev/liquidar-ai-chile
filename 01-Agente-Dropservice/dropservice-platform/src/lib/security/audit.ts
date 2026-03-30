import { logger } from '@infrastructure/telemetry/StructuredLogger';

/**
 * Security Audit Logger
 * Records critical security events for compliance and threat detection.
 */

type SecurityEventType =
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'CATALOG_MODIFICATION_ATTEMPT'
    | 'SENSITIVE_DATA_ACCESS'
    | 'PLATFORM_CONFIG_CHANGED';

export async function logSecurityEvent(
    eventType: SecurityEventType,
    userId: string | 'ANONYMOUS',
    details: Record<string, unknown>
) {
    const timestamp = new Date().toISOString();

    // In production, this should go to a secure log stream (Datadog, Splunk, or DB Table)
    // For now, we log to stdout with a specific prefix for filtering.

    logger.warn(`[SECURITY AUDIT] [${timestamp}] [${eventType}] User: ${userId}`, details);

    // NOTE: For MVP, stdout logs are captured by the hosting provider (Vercel/Supabase).
    // Future: Integrate with a dedicated SIEM or Audit Table if compliance requirements increase.
}
