import { Worker, Job, ConnectionOptions } from 'bullmq';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.factory';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { createAnalyzeQualityReportUseCase } from '@infrastructure/di/use-case-factory';

interface QAJobData {
    orderId: string;
    providerNotes: string;
    deliverableType: 'TEXT' | 'IMAGE' | 'URL';
    correlationId?: string;
}

const connection: ConnectionOptions = process.env.REDIS_URL ? {
    url: process.env.REDIS_URL
} : { host: 'localhost', port: 6379 };

export const createQASentinelWorker = () => {
    const worker = new Worker<QAJobData>(QUEUE_NAMES.QA_SENTINEL_JOBS, async (job: Job) => {
        const { orderId, providerNotes, deliverableType, correlationId } = job.data;

        const log = logger.withContext({
            jobId: job.id,
            process: 'QASentinelWorker',
            traceId: correlationId || orderId
        });

        log.info(`[QASentinelWorker] Iniciando control de calidad para orden: ${orderId}...`);

        try {
            const useCaseResult = createAnalyzeQualityReportUseCase();
            if (useCaseResult.isFailure()) {
                throw new Error(useCaseResult.getError().message);
            }
            const useCase = useCaseResult.getValue();
            const success = await useCase.execute(orderId, providerNotes, deliverableType);
            return { success };
        } catch (error) {
            log.error(`[QASentinelWorker] Job QA falló.`, error);
            throw error;
        }
    }, {
        connection,
        concurrency: 2,
    });

    worker.on('completed', (job) => {
        logger.info(`[QASentinelWorker] Job ${job.id} (Order ${job.data.orderId}) validado. Calificación generada.`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`[QASentinelWorker] Job QA ${job?.id} abortado.`, err);
    });

    return worker;
};
