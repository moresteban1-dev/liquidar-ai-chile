import { logger } from '@infrastructure/telemetry/StructuredLogger';

/**
 * Error Reporting Service
 *
 * Centralized error capture — currently logs to console.
 * When Sentry is installed, swap the implementation to Sentry.captureException().
 *
 * Usage:
 *   import { captureError } from '@/lib/error-reporting';
 *   captureError(error, { context: 'PaymentWebhook', userId: 'abc123' });
 */

interface ErrorContext {
    context?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Captures an error for external monitoring.
 * Ready to be swapped with Sentry when the SDK is installed:
 *
 * ```ts
 * import * as Sentry from '@sentry/nextjs';
 * Sentry.captureException(error, { extra: context });
 * ```
 */
export function captureError(error: unknown, context?: ErrorContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    logger.error(
        `[ErrorReporting] ${context?.context ?? 'Unknown'}:`,
        errorObj.message,
        context?.metadata || undefined
    );

    // ────────────────────────────────────────────────
    // When Sentry is installed, uncomment:
    //
    // import * as Sentry from '@sentry/nextjs';
    // Sentry.captureException(errorObj, {
    //     tags: { context: context?.context },
    //     user: context?.userId ? { id: context.userId } : undefined,
    //     extra: context?.metadata,
    // });
    // ────────────────────────────────────────────────
}

/**
 * Captures a breadcrumb for context (useful before an error occurs).
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    console.debug(`[Breadcrumb] ${category}: ${message}`, data ?? '');

    // When Sentry is installed:
    // Sentry.addBreadcrumb({ message, category, data, level: 'info' });
}
