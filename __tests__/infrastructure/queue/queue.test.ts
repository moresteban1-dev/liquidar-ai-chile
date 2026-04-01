import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getQueue, QUEUE_NAMES } from '@/infrastructure/queue/queue.factory';
import { createAIWorker } from '@/workers/ai.worker';
import { Queue, Worker } from 'bullmq';

// Mock BullMQ
vi.mock('bullmq', () => {
    return {
        Queue: vi.fn(),
        Worker: vi.fn().mockReturnValue({
            on: vi.fn(),
            close: vi.fn(),
        }),
    };
});

// Mock Redis Client
vi.mock('@/infrastructure/redis/client', () => ({
    redis: {}, // Mock redis instance
}));

// Mock Logger
vi.mock('@/infrastructure/observability/structured-logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        withContext: vi.fn().mockReturnValue({
            info: vi.fn(),
            error: vi.fn(),
        }),
    },
}));

describe('Queue Infrastructure', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Queue Factory', () => {
        it('creates a queue with the correct name', () => {
            const queue = getQueue(QUEUE_NAMES.AI_PROCESSING);
            expect(Queue).toHaveBeenCalledWith(QUEUE_NAMES.AI_PROCESSING, expect.any(Object));
            expect(queue).toBeDefined();
        });

        it('returns the same queue instance for the same name (Singleton)', () => {
            const queue1 = getQueue(QUEUE_NAMES.EMAILS);
            const queue2 = getQueue(QUEUE_NAMES.EMAILS);
            expect(queue1).toBe(queue2);
            expect(Queue).toHaveBeenCalledTimes(1);
        });
    });

    describe('AI Worker', () => {
        it.skip('creates a worker for the AI_PROCESSING queue', () => {
            const worker = createAIWorker();
            expect(Worker).toHaveBeenCalledWith(
                QUEUE_NAMES.AI_PROCESSING,
                expect.any(Function),
                expect.any(Object)
            );
            expect(worker).toBeDefined();
        });
    });
});
