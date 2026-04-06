import { NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/di/Container';
import { ICatalogRepository } from '@/core/application/ports/ICatalogRepository';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { withPublicApi } from '@/lib/api/with-auth';

/**
 * GET /api/services
 * 
 * Endpoint PÚBLICO — accesible sin autenticación.
 * Retorna los ítems activos del catálogo maestro V2 para la Landing Page.
 * Soporta tanto ítems tipo 'service' como 'mixed' y 'equipment'.
 */
export const GET = withPublicApi(async (_request) => {
  try {
    const container = await getContainer();
    const repository = await container.resolve<ICatalogRepository>('CatalogRepository');
    
    // getItems retorna Result<CatalogItem[], AppError> — necesitamos hacer unwrap
    const result = await repository.getItems({ 
      statusFilter: 'active' as any,
    });

    // Unwrap del Result (patrón correcto para la arquitectura V2)
    if (!result || (typeof (result as any).isSuccess === 'function' && !(result as any).isSuccess())) {
      logger.error('Error al obtener items del catálogo', (result as any)?.getError?.());
      return NextResponse.json([], { status: 200 }); // Graceful degradation
    }

    // Si es un Result, extraer el valor; si ya es un array, usarlo directo
    const rawItems = typeof (result as any).getValue === 'function' 
      ? (result as any).getValue() 
      : result;

    // Transformación con compatibilidad retroactiva al formato V1 del frontend
    const services = (rawItems || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description || item.shortDescription || '',
      
      // Soporte para MediaAsset[] y legacy image_url
      image_url: item.images && item.images.length > 0 
        ? item.images[0].url 
        : (item.metadata?.image_url as string | null) || null,
      
      // Mapeo de precios V2 → V1 para compatibilidad con ServiceCatalog
      price_from: item.priceSuggested || item.basePrice || item.priceReferenceMin || 0,
      base_price: item.basePrice || item.priceSuggested || null,
      price_reference_min: item.priceReferenceMin || null,
      price_reference_max: item.priceReferenceMax || null,
      category_id: item.categoryId,
      category: item.category || null,
      tags: item.tags || [],
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      
      // Información extendida V2
      media: {
        images: item.images || [],
        videos: item.videos || [],
      },
      technical_specs: item.technicalSpecs || {},
      is_featured: item.isFeatured || false,
    }));

    return NextResponse.json(services);
  } catch (error) {
    logger.error('Error en /api/services:', error as Error);
    return NextResponse.json(
      { error: 'Error al cargar servicios' },
      { status: 500 }
    );
  }
});
