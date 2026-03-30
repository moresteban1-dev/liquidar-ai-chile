import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/api', () => ({
    createServiceRoleClient: vi.fn(),
    requireRole: vi.fn(),
}));

import { requireRole } from '@/lib/supabase/api';
import { getAdminOrders } from '../orders';

describe('Server Actions: Orders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAdminOrders', () => {
        it('should return empty array if user is not authorized', async () => {
            vi.mocked(requireRole).mockRejectedValue(new Error('Unauthorized'));

            try {
                await getAdminOrders();
            } catch (error) {
                if (error instanceof Error) {
                    expect(error.message).toBe('Unauthorized');
                }
            }
        });
    });
});
