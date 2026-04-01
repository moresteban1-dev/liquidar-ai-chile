import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseProviderInventoryRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseProviderInventoryRepository';
import { ProviderInventoryService } from '@core/application/services/ProviderInventoryService';
import { UserRole } from '@/core/domain/auth/UserRole';

export const revalidate = 60; // Cache matching results for 60 seconds

/**
 * GET /api/quotations/[id]/matching
 * 
 * Devuelve proveedores sugeridos para cada ítem de la cotización
 * usando el motor de matching del inventario.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Verificar auth y rol admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }

        // Obtener ítems del proveedor asociados a esta cotización
        const { data: providerItems } = await supabase
            .from('quotation_provider_items')
            .select('id, concept, quantity, catalog_item_id')
            .eq('quotation_id', id);

        if (!providerItems || providerItems.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // Filtrar solo ítems con referencia al catálogo
        const itemsWithCatalog = providerItems.filter((pi: { catalog_item_id: string | null }) => pi.catalog_item_id);

        if (itemsWithCatalog.length === 0) {
            // Fallback: devolver los ítems sin matching
            return NextResponse.json({
                results: providerItems.map((pi: { id: string, concept: string, catalog_item_id: string | null }) => ({
                    itemId: pi.id,
                    itemName: pi.concept,
                    matches: []
                }))
            });
        }

        const repository = new SupabaseProviderInventoryRepository(supabase);
        const service = new ProviderInventoryService(repository);

        const matchingInput = itemsWithCatalog.map((pi: { catalog_item_id: string, quantity: number | null }) => ({
            itemId: pi.catalog_item_id,
            quantity: pi.quantity || 1
        }));

        const matchMapResult = await service.suggestProvidersForRFP(matchingInput);
        
        if (matchMapResult.isFailure()) {
            return NextResponse.json({ error: matchMapResult.getError().message }, { status: 500 });
        }

        const matchMap = matchMapResult.getValue();

        const results = providerItems.map((pi: { id: string, concept: string, catalog_item_id: string | null }) => {
            const matches = pi.catalog_item_id && matchMap ? (matchMap.get(pi.catalog_item_id) || []) : [];
            return {
                itemId: pi.id,
                itemName: pi.concept,
                matches
            };
        });

        return NextResponse.json({ results });
    } catch (error: any) {
        logger.error('Error interno del motor de matching', error);
        return NextResponse.json(
            { error: 'Error interno del motor de matching' },
            { status: 500 }
        );
    }
}
