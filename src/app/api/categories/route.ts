import { NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/di/Container';
import { ICatalogRepository } from '@app/ports/ICatalogRepository';
import { withPublicApi } from '@/lib/api/with-auth';

// GET: List all categories (Redirected to Catalog V2)
export const revalidate = 3600; // Cache ISR por 1 hora

export const GET = withPublicApi(async (_request) => {
    const container = await getContainer();
    const repository = await container.resolve<ICatalogRepository>('CatalogRepository');
    
    const result = await repository.getCategories();

    if (!result.isSuccess()) {
        return NextResponse.json(
            { error: 'Error al obtener categorías', message: String(result.getError()) }, 
            { status: 500 }
        );
    }

    const categories = result.getValue();

    // Transform to match expected format with _count (Mapping items to services count)
    const transformed = (categories || []).map((cat: any) => ({
        ...cat,
        _count: { services: cat.items?.[0]?.count || 0 }
    }));

    return NextResponse.json(transformed);
});

// POST: Create new category (Deprecated - Use Catalog V2 Server Actions)
export async function POST() {
    return NextResponse.json(
        { error: 'This endpoint is deprecated. Please use Catalog V2 Server Actions.' }, 
        { status: 410 }
    );
}
