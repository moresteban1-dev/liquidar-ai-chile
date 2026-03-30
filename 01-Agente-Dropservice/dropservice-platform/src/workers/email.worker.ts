import { Worker, Job, ConnectionOptions } from 'bullmq';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.factory';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { sendEmailSync, EmailOptions } from '@/lib/email';

const connection: ConnectionOptions = process.env.REDIS_URL ? {
    url: process.env.REDIS_URL
} : { host: 'localhost', port: 6379 };

export const createEmailWorker = () => {
    const worker = new Worker<EmailOptions>(QUEUE_NAMES.EMAILS, async (job: Job) => {
        const log = logger.withContext({
            jobId: job.id,
            queue: QUEUE_NAMES.EMAILS,
            to: job.data.to
        });

        log.info(`[EmailWorker] Processing email to ${job.data.to}...`);

        try {
            const result = await sendEmailSync(job.data);
            if (!result.success) {
                throw new Error(result.error || 'Unknown email sending error');
            }
            return result;
        } catch (error) {
            log.error(`[EmailWorker] Job Failed`, error);
            throw error;
        }
    }, {
        connection,
        concurrency: 10, // Higher concurrency since emails are I/O bound
        limiter: {
            max: 5, // Resend limits 
            duration: 1000
        }
    });

    worker.on('completed', (job) => {
        logger.info(`[EmailWorker] Job ${job.id} dispatched successfully`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[EmailWorker] Job ${job?.id} failed to send`, err);
    });

    return worker;
};
