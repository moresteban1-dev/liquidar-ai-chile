import { logger } from '@infrastructure/telemetry/StructuredLogger';

/**
 * n8n Webhook Trigger Helper
 */

export async function triggerN8nWebhook(event: string, payload: Record<string, unknown>) {
    const n8nBaseUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nBaseUrl) {
        logger.warn('N8N_WEBHOOK_URL not set, skipping webhook');
        return;
    }

    try {
        // Construct the full URL based on event type if needed, 
        // or send event type in body to a single endpoint.
        // Assuming single endpoint router for simplicity or mapped envs.
        // For this architecture, we append the event name to the base URL
        const url = `${n8nBaseUrl}/${event}`;

        // Fire and forget (don't await response to block UI, unless critical)
        // Check if we want to await. For notifications, better not to block.
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => logger.error('n8n webhook failed:', err));

    } catch (error) {
        logger.error('Error triggering n8n webhook:', error);
    }
}
