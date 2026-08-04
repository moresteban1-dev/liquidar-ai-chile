import { Worker, Job, ConnectionOptions } from 'bullmq';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.factory';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { liquidarAgent } from '@/lib/ai/flow'; // Import the flow to execute

// Define Job Data Structure
interface AIJobData {
    flowName: string;
    input: unknown;
    userId?: string;
    correlationId?: string;
}

const connection: ConnectionOptions = process.env.REDIS_URL ? {
    url: process.env.REDIS_URL
} : { host: 'localhost', port: 6379 };

export const createAIWorker = () => {
    const worker = new Worker<AIJobData>(QUEUE_NAMES.AI_PROCESSING, async (job: Job) => {
        const { flowName, input, correlationId } = job.data;
        const log = logger.withContext({
            jobId: job.id,
            flow: flowName,
            traceId: correlationId
        });

        log.info(`[Worker] Starting job...`);

        try {
            // Dispatch based on flow name
            if (flowName === 'liquidarAgent') {
                const result = await liquidarAgent(input);
                return result;
            }

            throw new Error(`Unknown flow: ${flowName}`);
        } catch (error) {
            log.error(`[Worker] Job Failed`, error);
            throw error;
        }
    }, {
        connection,
        concurrency: 5, // Process 5 jobs concurrently
        limiter: {
            max: 10,
            duration: 1000
        }
    });

    worker.on('completed', (job) => {
        logger.info(`[Worker] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[Worker] Job ${job?.id} failed`, err);
    });

    return worker;
};
