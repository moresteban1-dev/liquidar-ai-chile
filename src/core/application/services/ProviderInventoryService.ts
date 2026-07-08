import { Result, ok, fail } from '@core/shared/Result';
import { ProviderInventoryRepository } from '../ports/ProviderInventoryRepository';
import {
    ProviderInventoryItem,
    InventoryStats,
    ProviderMatch
} from '../../domain/provider/ProviderInventoryTypes';

export class ProviderInventoryService {
    constructor(private repository: ProviderInventoryRepository) { }

    async getInventory(providerId: string): Promise<Result<ProviderInventoryItem[], Error>> {
        return this.repository.getInventoryByProviderId(providerId);
    }

    async getItem(providerId: string, itemId: string): Promise<Result<ProviderInventoryItem | null, Error>> {
        return this.repository.getItem(providerId, itemId);
    }

    async addItem(item: Partial<ProviderInventoryItem>): Promise<Result<ProviderInventoryItem, Error>> {
        // Validaciones básicas de negocio
        if (!item.providerId || !item.itemId) {
            return fail(new Error('ProviderId e ItemId son obligatorios.'));
        }
        if (item.costPerUnit === undefined || item.costPerUnit < 0) {
            return fail(new Error('El costo por unidad debe ser válido.'));
        }

        item.status = item.status || 'ACTIVE';
        item.isAvailable = item.isAvailable !== undefined ? item.isAvailable : true;

        return this.repository.saveItem(item);
    }

    async updateItem(id: string, providerId: string, updates: Partial<ProviderInventoryItem>): Promise<Result<ProviderInventoryItem, Error>> {
        const existingResult = await this.repository.getInventoryByProviderId(providerId);
        
        if (existingResult.isFailure()) return fail(existingResult.getError());

        const item = (existingResult.value || []).find(i => i.id === id);

        if (!item) {
            return fail(new Error('Ítem no encontrado en el inventario del proveedor.'));
        }

        return this.repository.saveItem({ ...item, ...updates });
    }

    async toggleAvailability(id: string, isAvailable: boolean): Promise<Result<void, Error>> {
        return this.repository.toggleAvailability(id, isAvailable);
    }

    async deleteItem(id: string): Promise<Result<void, Error>> {
        return this.repository.deleteItem(id);
    }

    async getStats(providerId: string): Promise<Result<InventoryStats, Error>> {
        return this.repository.getStats(providerId);
    }

    /**
     * Motor de Matching: Busca proveedores para una lista de ítems solicitados en un RFP.
     */
    async suggestProvidersForRFP(items: { itemId: string; quantity: number }[]): Promise<Result<Map<string, ProviderMatch[]>, Error>> {
        const suggestions = new Map<string, ProviderMatch[]>();

        try {
            for (const item of items) {
                const matchesResult = await this.repository.findMatchesForItem(item.itemId, item.quantity);
                
                if (matchesResult.isFailure()) {
                    return fail(matchesResult.getError());
                }

                const matches = matchesResult.value || [];
                // Ordenamos por rating (desc) y precio (asc)
                const sortedMatches = matches.sort((a, b) => {
                    if (b.rating !== a.rating) return b.rating - a.rating;
                    return a.costPerUnit - b.costPerUnit;
                });
                suggestions.set(item.itemId, sortedMatches);
            }

            return ok(suggestions);
        } catch (e: unknown) {
            return fail(e instanceof Error ? e : new Error(String(e)));
        }
    }
}
