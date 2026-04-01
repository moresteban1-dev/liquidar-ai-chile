import { Result } from '@core/shared/Result';
import {
    ProviderInventoryItem,
    InventoryStats,
    ProviderMatch
} from '../../domain/provider/ProviderInventoryTypes';

export interface ProviderProfile {
    id: string;
    name: string;
    role: string;
}

export interface ProviderInventoryRepository {
    /**
     * Obtiene todos los proveedores.
     */
    getAllProviders(): Promise<Result<ProviderProfile[], Error>>;

    /**
     * Obtiene el expertise del proveedor.
     */
    getProviderExpertise(providerId: string): Promise<Result<string, Error>>;

    /**
     * Obtiene el inventario completo de un proveedor.
     */
    getInventoryByProviderId(providerId: string): Promise<Result<ProviderInventoryItem[], Error>>;

    /**
     * Obtiene un ítem específico del inventario.
     */
    getItem(providerId: string, itemId: string): Promise<Result<ProviderInventoryItem | null, Error>>;

    /**
     * Crea o actualiza un ítem en el inventario.
     */
    saveItem(item: Partial<ProviderInventoryItem>): Promise<Result<ProviderInventoryItem, Error>>;

    /**
     * Cambia la disponibilidad de un ítem.
     */
    toggleAvailability(id: string, isAvailable: boolean): Promise<Result<void, Error>>;

    /**
     * Elimina un ítem del inventario.
     */
    deleteItem(id: string): Promise<Result<void, Error>>;

    /**
     * Obtiene estadísticas agregadas del inventario.
     */
    getStats(providerId: string): Promise<Result<InventoryStats, Error>>;

    /**
     * Encuentra proveedores que ofrecen un ítem específico.
     * Corazón del motor de matching.
     */
    findMatchesForItem(itemId: string, minQuantity?: number): Promise<Result<ProviderMatch[], Error>>;
}
