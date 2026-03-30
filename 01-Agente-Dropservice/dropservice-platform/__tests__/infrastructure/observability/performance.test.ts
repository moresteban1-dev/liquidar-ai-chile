import { describe, it, expect, vi } from 'vitest';
import { PerformanceObserver } from '@/infrastructure/observability/performance-observer';
import { logger } from '@/infrastructure/observability/structured-logger';

// Mock logger
vi.mock('@/infrastructure/observability/structured-logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    }
}));

describe('PerformanceObserver', () => {
    it('measures async function duration and logs success', async () => {
        const mockFn = vi.fn().mockResolvedValue('result');

        // Slight delay to ensure duration > 0 (though test environments can be fast)
        await PerformanceObserver.measure('test_op', async () => {
            await new Promise(r => setTimeout(r, 10));
            return mockFn();
        });

        expect(mockFn).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
            '[Performance] test_op',
            expect.objectContaining({
                duration_ms: expect.any(Number),
                status: 'success'
            })
        );
    });

    it('measures error duration and logs failure', async () => {
        const error = new Error('fail');
        const mockFn = vi.fn().mockRejectedValue(error);

        await expect(PerformanceObserver.measure('test_error', mockFn))
            .rejects.toThrow('fail');

        expect(logger.error).toHaveBeenCalledWith(
            '[Performance] test_error Failed',
            error,
            expect.objectContaining({
                duration_ms: expect.any(Number),
                status: 'error'
            })
        );
    });
});
