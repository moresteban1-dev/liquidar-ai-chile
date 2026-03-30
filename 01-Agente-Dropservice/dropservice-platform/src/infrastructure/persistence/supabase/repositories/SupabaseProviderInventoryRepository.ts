import { SupabaseClient } from '@supabase/supabase-js';
import { ProviderInventoryRepository, ProviderProfile } from '@core/application/ports/ProviderInventoryRepository';
import { Result, ok, fail } from '@core/shared/Result';
import {
    ProviderInventoryItem,
    InventoryStats,
    ProviderMatch
} from '@core/domain/provider/ProviderInventoryTypes';

export class SupabaseProviderInventoryRepository implements ProviderInventoryRepository {
    constructor(private readonly supabase: SupabaseClient) {}

    async getAllProviders(): Promise<Result<ProviderProfile[], Error>> {
        try {
            const { data, error } = await this.supabase
                .from('providers')
                .select('id, name, role');

            if (error) return fail(new Error(error.message));
            return ok((data || []).map((d: any) => ({
                id: d.id,
                name: d.name,
                role: d.role
            })));
        } catch (e: any) {
            return fail(e instanceof Error ? e : new Error(String(e)));
        }
    }

    async getProviderExpertise(providerId: string): Promise<Result<string, Error>> {
        try {
            const { data, error } = await this.supabase
                .from('provider_inventory')
                .select('item_id, catalog_items(name)')
                .eq('provider_id', providerId);

            if (error) return fail(new Error(error.message));
            
            const expertise = (data || [])
                .map((d: any) => d.catalog_items?.name)
                .filter(Boolean)
                .join(', ');

            return ok(expertise || 'Ninguna especificada');
        } catch (e: any) {
            return fail(e instanceof Error ? e : new Error(String(e)));
        }
    }

    async getInventoryByProviderId(providerId: string): Promise<Result<ProviderInventoryItem[], Error>> {
        try {
            const { data, error } = await this.supabase
                .from('provider_inventory')
                .select('*')
                .eq('provider_id', providerId);

            if (error) return fail(new Error(error.message));
            return ok((data || []).map(this.mapToDomain));
        } catch (e: any) {
            return fail(e instanceof Error ? e : new Error(String(e)));
        }
    }

    async getItem(providerId: string, itemId: string): Promise<Result<ProviderInventoryItem | null, Error>> {
        try {
            const { data, error } = await this.supabase
                .from('provider_inventory')
                .select('*')
                .eq('provider_id', providerId)
                .eq('item_id', itemId)
                .maybeSingle();

            if (error) return fail(new Error(error.message));
            return ok(data ? this.mapToDomain(data) : null);
        } catch (e: any) {
            return fail(e instanceof Error ? e : new Error(String(e)));
        }
    }

    async saveItem(item: Partial<ProviderInventoryItem>): Promise<Result<ProviderInventoryItem, Error>> {
        try {
            const { data, error } = await this.supabase
                .from('provider_inventory')
                .upsert({
                    id: item.id,
                    provider_id: item.providerId,
                    item_id: item.itemId,
                    cost_per_unit: item.costPerUnit,
                    available_quantity: item.availableQuantity,
                    min_rental_days: item.minRentalDays || 1,
                    advance_booking_days: item.advanceBookingDays || 0,
                    is_available: item.isAvailable,
                    status: item.status,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) return fail(new Error(error.message));
            return ok(this.mapToDomain(data));
        } catch (e: any) {
            return fail(e instanceof Error ? e : new Error(String(e)));
        }
    }

    async toggleAvailability(id: string, isAvailable: boolean): Promise<Result<void, Error>> {
        try {
            const { error } = await this.supabase
                .from('provider_inventory')
                .update({ is_available: isAvailable })
                .eq('id', id);

            if (error) return fail(new Error(error.message));
            return ok(undefined);
        } catch (e: any) {
            return fail(e instanceof Error ? e : new Error(String(e)));
        }
    }

    async deleteItem(id: string): Promise<Result<void, Error>> {
        try {
            const { error } = await this.supabase
                .from('provider_inventory')
                .delete()
                .eq('id', id);

            if (error) return fail(new Error(error.message));
            return ok(undefined);
        } catch (e: any) {
            return fail(e instanceof Error ? e : new Error(String(e)));
        }
    }

    async getStats(providerId: string): Promise<Result<InventoryStats, Error>> {
        try {
            const { data, error } = await this.supabase
                .from('provider_inventory')
                .select('cost_per_unit, is_available')
                .eq('provider_id', providerId);

            if (error) return fail(new Error(error.message));

            const items = data || [];
            const availableItems = items.filter((i: any) => i.is_available).length;
            const totalValue = items.reduce((sum: number, i: any) => sum + (i.cost_per_unit || 0), 0);
            
            return ok({
                totalItems: items.length,
                availableItems,
                totalValue,
                averageCost: items.length > 0 ? totalValue / items.length : 0
            });
        } catch (e: any) {
            return fail(e instanceof Error ? e : new Error(String(e)));
        }
    }

    async findMatchesForItem(itemId: string, minQuantity?: number): Promise<Result<ProviderMatch[], Error>> {
        try {
            let query = this.supabase
                .from('provider_inventory')
                .select(`
                    id,
                    cost_per_unit,
                    provider_id,
                    available_quantity,
                    providers (
                        name
                    )
                `)
                .eq('item_id', itemId)
                .eq('is_available', true);

            if (minQuantity) {
                query = query.gte('available_quantity', minQuantity);
            }

            const { data, error } = await query;

            if (error) return fail(new Error(error.message));

            return ok((data || []).map((d: any) => ({
                providerId: d.provider_id,
                companyName: d.providers?.name || 'Unknown',
                costPerUnit: d.cost_per_unit,
                availableQuantity: d.available_quantity,
                rating: 0
            })));
        } catch (e: any) {
            return fail(e instanceof Error ? e : new Error(String(e)));
        }
    }

    private mapToDomain(data: any): ProviderInventoryItem {
        return {
            id: data.id,
            providerId: data.provider_id,
            itemId: data.item_id,
            costPerUnit: data.cost_per_unit,
            availableQuantity: data.available_quantity,
            minRentalDays: data.min_rental_days || 1,
            advanceBookingDays: data.advance_booking_days || 0,
            isAvailable: data.is_available,
            status: data.status,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
}
