import { NextResponse } from 'next/server';
import { getContainer } from '@/infrastructure/di/Container';
import { CatalogRepository } from '@core/application/ports/CatalogRepository';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { withAuth } from '@/lib/api/with-auth';

export const GET = withAuth(async (_request, _user) => {
  try {
    const container = await getContainer();
    const repository = await container.resolve<CatalogRepository>('CatalogRepository');
    
    const items = await repository.getItems({ 
      statusFilter: 'active' as any,
      typeFilter: 'service' as any 
    });

    // Transformación con compatibilidad retroactiva
    const services = (items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      
      // ✅ FIX CRÍTICO: Soporte para MediaAsset[] y legacy image_url
      image_url: item.images && item.images.length > 0 
        ? item.images[0].url 
        : (item.metadata?.image_url as string | null) || null,
      
      base_price: item.basePrice || item.priceSuggested || null,
      price_reference_min: item.priceReferenceMin || null,
      price_reference_max: item.priceReferenceMax || null,
      category_id: item.categoryId,
      tags: item.tags || [],
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      
      // Información extendida para clientes nuevos (V2)
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
