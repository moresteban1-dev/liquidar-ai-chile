import { Worker, Job, ConnectionOptions } from 'bullmq';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.factory';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { diContainer } from '@infrastructure/di/CoreContainer';

interface AIBrokerJobData {
    quotationId: string;
    correlationId?: string;
}

const connection: ConnectionOptions = process.env.REDIS_URL ? {
    url: process.env.REDIS_URL
} : { host: 'localhost', port: 6379 };

export const createAIBrokerWorker = () => {
    const worker = new Worker<AIBrokerJobData>(QUEUE_NAMES.AI_BROKER_JOBS, async (job: Job) => {
        const { quotationId, correlationId } = job.data;

        const log = logger.withContext({
            jobId: job.id,
            process: 'AIBrokerWorker',
            traceId: correlationId || quotationId
        });

        log.info(`[AIBrokerWorker] Iniciando procesamiento de auto-asignación para cotización: ${quotationId}...`);

        try {
            const result = await diContainer.getAIBrokerService().matchProviderForQuotation(quotationId);

            if (result.success && result.assignedTo) {
                log.info(`[AIBrokerWorker] Cotización asignada inteligentemente a ${result.assignedTo}. (Score: ${result.bestScore})`);
            } else if (result.success && !result.assignedTo) {
                log.info(`[AIBrokerWorker] Sin asignación automática. Razón: ${result.reason}`);
            } else {
                log.warn(`[AIBrokerWorker] Fallo silencioso en el matching AI. Razón: ${result.reason}`);
            }

            return result;
        } catch (error) {
            log.error(`[AIBrokerWorker] Job falló estrepitosamente.`, error);
            throw error;
        }
    }, {
        connection,
        concurrency: 1, // Let's keep AI calls to 1 concurrency per worker initially to avoid OpenAI rate limits
        limiter: {
            max: 5,
            duration: 1000
        }
    });

    worker.on('completed', (job) => {
        logger.info(`[AIBrokerWorker] Job ${job.id} (Quotation ${job.data.quotationId}) procesado correctamente.`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[AIBrokerWorker] Job ${job?.id} falló durante el matching.`, err);
    });

    return worker;
};
