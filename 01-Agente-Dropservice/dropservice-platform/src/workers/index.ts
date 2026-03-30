import { createAIWorker } from './ai.worker';
import { createEmailWorker } from './email.worker';
import { createAIBrokerWorker } from './ai-broker.worker';
import { createNegotiatorWorker } from './negotiator.worker';
import { createQASentinelWorker } from './qasentinel.worker';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

async function main() {
    logger.info('[Worker] Starting worker process...');

    try {
        const aiWorker = createAIWorker();
        const emailWorker = createEmailWorker();
        const aiBrokerWorker = createAIBrokerWorker();
        const negotiatorWorker = createNegotiatorWorker();
        const qaSentinelWorker = createQASentinelWorker();

        logger.info(`[Worker] General AI Worker initialized: ${aiWorker.name}`);
        logger.info(`[Worker] Email Worker initialized: ${emailWorker.name}`);
        logger.info(`[Worker] Matchmaking AI Broker Worker initialized: ${aiBrokerWorker.name}`);
        logger.info(`[Worker] Negotiator Agent Worker initialized: ${negotiatorWorker.name}`);
        logger.info(`[Worker] QA Sentinel Agent Worker initialized: ${qaSentinelWorker.name}`);

        // Keep process alive
        process.on('SIGTERM', async () => {
            logger.info('[Worker] SIGTERM received. Closing workers...');
            await aiWorker.close();
            await emailWorker.close();
            await aiBrokerWorker.close();
            await negotiatorWorker.close();
            await qaSentinelWorker.close();
            process.exit(0);
        });

    } catch (error) {
        logger.fatal('[Worker] Failed to start worker process', error);
        process.exit(1);
    }
}

main();
