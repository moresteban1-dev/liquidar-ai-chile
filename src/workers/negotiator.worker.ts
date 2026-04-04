import { Worker, Job, ConnectionOptions } from 'bullmq';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.factory';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createNegotiateProviderBidUseCase } from '@infrastructure/di/use-case-factory';

interface NegotiatorJobData {
    quotationId: string;
    providerId: string;
    correlationId?: string;
}

const connection: ConnectionOptions = process.env.REDIS_URL ? {
    url: process.env.REDIS_URL
} : { host: 'localhost', port: 6379 };

export const createNegotiatorWorker = () => {
    const worker = new Worker<NegotiatorJobData>(QUEUE_NAMES.NEGOTIATOR_JOBS, async (job: Job) => {
        const { quotationId, providerId, correlationId } = job.data;

        const log = logger.withContext({
            jobId: job.id,
            process: 'NegotiatorWorker',
            traceId: correlationId || quotationId
        });

        log.info(`[NegotiatorWorker] Iniciando revisión/negociación para cotización: ${quotationId}...`);

        try {
            const useCaseResult = createNegotiateProviderBidUseCase();
            if (useCaseResult.isFailure()) {
                throw new Error(useCaseResult.getError().message);
            }
            const useCase = useCaseResult.getValue();
            const success = await useCase.execute(quotationId, providerId);
            return { success };
        } catch (error) {
            log.error(`[NegotiatorWorker] Job falló.`, error);
            throw error;
        }
    }, {
        connection,
        concurrency: 2, // Concurrent execution limits to balance LLM API
    });

    worker.on('completed', (job) => {
        logger.info(`[NegotiatorWorker] Job ${job.id} (Quotation ${job.data.quotationId}) procesado correctamente.`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[NegotiatorWorker] Job ${job?.id} falló durante el análisis.`, err);
    });

    return worker;
};
