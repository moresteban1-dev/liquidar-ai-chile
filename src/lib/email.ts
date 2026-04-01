import { logger } from './logger';
import { getQueue, QUEUE_NAMES } from '@infrastructure/queue/queue.factory';

/**
 * Email Utility Library
 * 
 * Provides email sending functionality using Resend or fallback to console.
 * Set RESEND_API_KEY in environment variables to enable.
 */

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

interface ResendResponse {
    id?: string;
    error?: { message: string };
}

/**
 * Synchronously Send an email using Resend API (Internal use by Worker)
 * Falls back to console log in development
 */
export async function sendEmailSync(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const { to, subject, html, from = 'Agencia Digital <notificaciones@agencia.cl>' } = options;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    // Development mode: log to console
    if (!RESEND_API_KEY) {
        if (process.env.NODE_ENV !== 'production') {
            logger.info('📧 Email (dev mode):', { to, subject, from });
        }
        return { success: true, id: 'dev-' + Date.now() };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from, to, subject, html }),
        });

        const data: ResendResponse = await response.json();

        if (!response.ok) {
            logger.error('Email error:', { error: data.error });
            return { success: false, error: data.error?.message || 'Error sending email' };
        }

        return { success: true, id: data.id };
    } catch (error) {
        logger.error('Email error:', { error });
        return { success: false, error: 'Connection error' };
    }
}

/**
 * Asynchronously Send an email by pushing to BullMQ 
 * (Returns immediately with success:true to unblock API routes)
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const queue = getQueue(QUEUE_NAMES.EMAILS);
        if (queue) {
            const job = await queue.add('send-email', options);
            logger.info('📧 [Async] Email enqueued successfully:', { id: job.id, to: options.to });
            return { success: true, id: job.id };
        }
    } catch (err) {
        logger.error('Failed to queue email async. Falling back to sync execution.', { error: err });
    }

    // Fallback to sync if Redis/Queue is down
    return sendEmailSync(options);
}
