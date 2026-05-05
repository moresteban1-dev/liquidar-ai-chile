import { Queue, ConnectionOptions } from 'bullmq';
import { getRedis } from '@infrastructure/redis/client';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

// Queue names registry to prevent typos
export const QUEUE_NAMES = {
    AI_PROCESSING: 'ai-processing',
    NOTIFICATIONS: 'notifications',
    EMAILS: 'emails',
    AI_BROKER_JOBS: 'ai-broker-jobs',
    NEGOTIATOR_JOBS: 'negotiator-jobs',
    QA_SENTINEL_JOBS: 'qa-sentinel-jobs'
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

// Global queue registry
const queues: Record<string, Queue> = {};

export const getQueue = (name: QueueName): Queue => {
    if (queues[name]) {
        return queues[name];
    }

    if (!getRedis()) {
        // Fallback or Error? 
        // For queuing, if Redis is down, we usually can't function asynchronously.
        // We log a critical warning. The app might need to crash or fallback to sync execution.
        logger.warn(`[QueueFactory] Redis not available. Queue ${name} will not function correctly.`);
    }

    // We pass connection settings. BullMQ creates its own managed connections usually,
    // but we can reuse the connection info.
    const connection: ConnectionOptions = process.env.REDIS_URL ? {
        url: process.env.REDIS_URL
    } : { host: 'localhost', port: 6379 };

    queues[name] = new Queue(name, {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: true,
            removeOnFail: false
        }
    });

    logger.info(`[QueueFactory] Initialized queue: ${name}`);
    return queues[name];
};
