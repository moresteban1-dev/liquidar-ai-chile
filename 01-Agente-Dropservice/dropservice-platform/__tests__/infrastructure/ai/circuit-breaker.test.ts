import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker } from '@/infrastructure/ai/services/ResilientGenkitService';

describe('CircuitBreaker', () => {
    it('permite llamadas cuando está cerrado', async () => {
        const cb = new CircuitBreaker(3, 1000);
        const fn = vi.fn().mockResolvedValue('ok');

        const result = await cb.execute(fn, 'test-context');

        expect(result).toBe('ok');
        expect(fn).toHaveBeenCalledOnce();
    });

    it('abre el circuito después de N fallos', async () => {
        const cb = new CircuitBreaker(2, 1000);
        const fn = vi.fn().mockRejectedValue(new Error('fail'));

        // 2 fallos
        await expect(cb.execute(fn, 'test-context')).rejects.toThrow();
        await expect(cb.execute(fn, 'test-context')).rejects.toThrow();

        // El 3er intento ni llama a fn
        // Expects the circuit breaker to be open and throw immediately
        await expect(cb.execute(fn, 'test-context')).rejects.toThrow();
        expect(fn).toHaveBeenCalledTimes(2); // No 3
    });
});
