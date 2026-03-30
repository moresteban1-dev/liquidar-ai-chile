/**
 * GET /api/catalog/items
 *
 * Returns active catalog items for client-side selection components.
 * Used by the vendor RFP form to link quoted items to the master catalog.
 * Supports optional ?search= query param for filtering.
 */

import { NextResponse } from 'next/server';
import { SupabaseCatalogRepository } from '@infrastructure/persistence/supabase/repositories/SupabaseCatalogRepository';
import { CatalogService } from '@core/application/services/CatalogService';
import { createClient } from '@/lib/supabase/server';
import { CatalogItemMapper } from '@infrastructure/persistence/supabase/mappers/CatalogItemMapper';
import { CatalogCategoryMapper } from '@infrastructure/persistence/supabase/mappers/CatalogCategoryMapper';
import { withAuth } from '@/lib/api/with-auth';

export const GET = withAuth(async (_request) => {
    const supabase = await createClient();

    const catalogRepo = new SupabaseCatalogRepository(
        supabase,
        new CatalogItemMapper(),
        new CatalogCategoryMapper()
    );
    const catalogService = new CatalogService(catalogRepo);

    const itemsResult = await catalogService.getAllItems({
        statusFilter: 'active',
        typeFilter: undefined, // Or map from categoryId if needed
    });

    if (itemsResult.isFailure()) {
        return NextResponse.json({ error: itemsResult.getError().message }, { status: 500 });
    }

    const items = itemsResult.getValue();

    // Return a lightweight projection (avoid leaking margins/internal data)
    const result = items.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        categoryName: (item as any).category?.name || 'Sin categoría',
        itemType: item.type, // CatalogItem uses 'type', not 'itemType'
        unitLabel: (item as any).unitLabel,
        priceSuggested: item.priceSuggested,
        priceReferenceMin: item.priceReferenceMin,
        priceReferenceMax: item.priceReferenceMax,
    }));

    return NextResponse.json({ items: result });
});
