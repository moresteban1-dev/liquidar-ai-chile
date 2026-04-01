import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/api', () => ({
    createServiceRoleClient: vi.fn(),
    getAuthUser: vi.fn(),
    requireRole: vi.fn(),
}));

vi.mock('@infrastructure/telemetry/StructuredLogger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
}));

import { getAuthUser, requireRole } from '../../lib/supabase/api';
import { UserRole } from '../../core/domain/auth/UserRole';
import { submitProviderBidAction } from '../provider-bid';
import { setMarkupAndApprove } from '../quotations';

describe('Server Actions: Provider Bids & Quotations', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Provider Bidding (submitProviderBidAction)', () => {
        it('should block unauthenticated users', async () => {
            vi.mocked(getAuthUser).mockResolvedValue(null);

            const result = await submitProviderBidAction({
                quotationId: '123',
                items: [{ category: 'SERVICIO', concept: 'test', quantity: 1, unitPriceNet: 100 }]
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('No autorizado');
        });

        it('should block non-provider roles', async () => {
            vi.mocked(getAuthUser).mockResolvedValue({ id: 'abc', role: UserRole.CLIENT, email: 'test@test.com', name: 'Test' });

            const result = await submitProviderBidAction({
                quotationId: '123',
                items: [{ category: 'SERVICIO', concept: 'test', quantity: 1, unitPriceNet: 100 }]
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Solo proveedores pueden enviar cotizaciones');
        });

        it('should fail if items are empty', async () => {
            vi.mocked(getAuthUser).mockResolvedValue({ id: 'abc', role: UserRole.VENDOR, email: 'test@test.com', name: 'Test' });

            const result = await submitProviderBidAction({
                quotationId: '123',
                items: []
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Debe incluir al menos un item');
        });

        it('should fail if an item has invalid category', async () => {
            vi.mocked(getAuthUser).mockResolvedValue({ id: 'abc', role: UserRole.VENDOR, email: 'test@test.com', name: 'Test' });

            const result = await submitProviderBidAction({
                quotationId: '123',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                items: [{ category: 'INVALID' as any, concept: 'test', quantity: 1, unitPriceNet: 100 }]
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Categoría inválida');
        });
    });

    describe('Admin Quotations (setMarkupAndApprove)', () => {
        it('should throw if role is not ADMIN', async () => {
            vi.mocked(requireRole).mockRejectedValue(new Error('Unauthorized'));

            const result = await setMarkupAndApprove('123', 5000, 15000);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Unauthorized');
        });
    });
});
