import { createServiceRoleClient } from '@/lib/supabase/api';
import { loaderRegistry } from '../shared/LoaderRegistry';

/**
 * Specialized loaders for high-frequency domain objects.
 */
export class DomainLoaders {
    
    /**
     * Batches lookups for Quotation Items by Quotation ID.
     */
    public static itemsByQuotationId() {
        return loaderRegistry.getLoader('items-by-quotation', async (quotationIds: readonly string[]) => {
            const supabase = createServiceRoleClient();
            const { data, error } = await supabase
                .from('quotation_items')
                .select('*')
                .in('quotation_id', quotationIds);

            if (error) throw error;

            // Group items by quotation_id to return in correct order
            return quotationIds.map(id => 
                data.filter(item => item.quotation_id === id)
            );
        });
    }

    /**
     * Batches lookups for Catalog metadata.
     */
    public static catalogItemById() {
        return loaderRegistry.getLoader('catalog-item', async (ids: readonly string[]) => {
            const supabase = createServiceRoleClient();
            const { data, error } = await supabase
                .from('catalog_items')
                .select('*')
                .in('id', ids);

            if (error) throw error;

            const map = new Map(data.map(item => [item.id, item]));
            return ids.map(id => map.get(id) || new Error(`Catalog item ${id} not found`));
        });
    }
}
