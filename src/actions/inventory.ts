'use server';

import { getContainer } from '@/infrastructure/di/Container';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

/**
 * Server Action: Add item to inventory
 * Reemplaza addItemToInventoryAction para coincidir con lo que espera el frontend
 */
export async function addInventoryItemAction(data: any) {
    try {
        const authRes = await requireRole(UserRole.VENDOR);
        if (authRes.isFailure()) {
            return { success: false, error: 'No autorizado: ' + authRes.getError().message };
        }

        const container = await getContainer();
        const service = await container.resolve<any>('ProviderInventoryService');
        const result = await service.addInventoryItem({
            ...data,
            provider_id: authRes.getValue().user.id // Force ownership
        });
        revalidatePath('/admin/inventory');
        return { success: true, data: result };
    } catch (error) {
        logger.error('Error in addInventoryItemAction:', error);
        return { success: false, error: 'Error al agregar item al inventario' };
    }
}

/**
 * Server Action: Toggle item availability
 */
export async function toggleInventoryAvailabilityAction(id: string, isAvailable: boolean) {
    try {
        const authRes = await requireRole(UserRole.VENDOR);
        if (authRes.isFailure()) return { success: false, error: 'No autorizado' };

        const container = await getContainer();
        const service = await container.resolve<any>('ProviderInventoryService');
        // Ownership check is delegated to service or repository via RLS/Query
        await service.toggleAvailability(id, isAvailable);
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        logger.error('Error in toggleInventoryAvailabilityAction:', error);
        return { success: false, error: 'Error al cambiar disponibilidad' };
    }
}

/**
 * Server Action: Delete inventory item
 */
export async function deleteInventoryItemAction(id: string) {
    try {
        const authRes = await requireRole(UserRole.VENDOR);
        if (authRes.isFailure()) return { success: false, error: 'No autorizado' };

        const container = await getContainer();
        const service = await container.resolve<any>('ProviderInventoryService');
        await service.deleteInventoryItem(id);
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        logger.error('Error in deleteInventoryItemAction:', error);
        return { success: false, error: 'Error al eliminar item del inventario' };
    }
}

/**
 * Alias de compatibilidad
 */
export async function addItemToInventoryAction(data: any) {
    return addInventoryItemAction(data);
}
