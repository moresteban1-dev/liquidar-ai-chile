'use server';

import { getContainer } from '@/infrastructure/di/Container';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Add item to inventory
 * Reemplaza addItemToInventoryAction para coincidir con lo que espera el frontend
 */
export async function addInventoryItemAction(data: any) {
    try {
        const container = await getContainer();
        const service = await container.resolve<any>('ProviderInventoryService');
        const result = await service.addInventoryItem(data);
        revalidatePath('/admin/inventory');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error in addInventoryItemAction:', error);
        return { success: false, error: 'Error al agregar item al inventario' };
    }
}

/**
 * Server Action: Toggle item availability
 */
export async function toggleInventoryAvailabilityAction(id: string, isAvailable: boolean) {
    try {
        const container = await getContainer();
        const service = await container.resolve<any>('ProviderInventoryService');
        await service.toggleAvailability(id, isAvailable);
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        console.error('Error in toggleInventoryAvailabilityAction:', error);
        return { success: false, error: 'Error al cambiar disponibilidad' };
    }
}

/**
 * Server Action: Delete inventory item
 */
export async function deleteInventoryItemAction(id: string) {
    try {
        const container = await getContainer();
        const service = await container.resolve<any>('ProviderInventoryService');
        await service.deleteInventoryItem(id);
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        console.error('Error in deleteInventoryItemAction:', error);
        return { success: false, error: 'Error al eliminar item del inventario' };
    }
}

/**
 * Alias de compatibilidad
 */
export async function addItemToInventoryAction(data: any) {
    return addInventoryItemAction(data);
}
