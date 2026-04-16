'use server';

import { revalidatePath } from 'next/cache';
import { z, ZodError } from 'zod';
import { CatalogService } from '@core/application/services/CatalogService';
import { SupabaseCatalogRepository } from '@infrastructure/persistence/supabase/repositories/SupabaseCatalogRepository';
import { getContainer } from '@/infrastructure/di/Container';
import { DI_KEYS } from '@/infrastructure/di/DIKeys';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { requireRole } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';

// ============ SCHEMAS ============

const MediaAssetSchema = z.object({
  url: z.string().url('URL inválida'),
  type: z.enum(['image', 'video', 'document']),
  altText: z.string().optional(),
  caption: z.string().optional(),
  order: z.number().int().min(0).default(0),
});

const CreateCatalogItemSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  slug: z.string().optional(),
  type: z.enum(['service', 'product', 'equipment']),
  categoryId: z.string().uuid('ID de categoría inválido'),
  description: z.string().optional(),
  priceSuggested: z.number().positive('El precio debe ser positivo').optional(),
  priceReferenceMin: z.number().positive('El precio mínimo debe ser positivo').optional(),
  priceReferenceMax: z.number().positive('El precio máximo debe ser positivo').optional(),
  defaultMarginPercent: z.number().min(0).max(100, 'El margen debe estar entre 0 y 100').optional(),
  images: z.array(MediaAssetSchema).default([]),
  videos: z.array(MediaAssetSchema).default([]),
  documents: z.array(MediaAssetSchema).default([]),
  technicalSpecs: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  isFeatured: z.boolean().default(false),
});

const UpdateCatalogItemSchema = CreateCatalogItemSchema.partial();

// ============ FACTORY ============

import { createClient } from '@/lib/supabase/server';
import { CatalogItemMapper } from '@infrastructure/persistence/supabase/mappers/CatalogItemMapper';
import { CatalogCategoryMapper } from '@infrastructure/persistence/supabase/mappers/CatalogCategoryMapper';

async function getCatalogService(): Promise<CatalogService> {
  const supabase = await createClient();
  const repository = new SupabaseCatalogRepository(
    supabase,
    new CatalogItemMapper(),
    new CatalogCategoryMapper()
  );
  
  return new CatalogService(repository);
}

// ============ ITEM ACTIONS ============

export async function createCatalogItemAction(formData: FormData) {
  try {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: authResult.getError().message };
    }

    const rawData = Object.fromEntries(formData.entries());
    
    // Parsear campos JSON
    const parsedData = {
      ...rawData,
      images: typeof rawData.images === 'string' ? JSON.parse(rawData.images) : [],
      videos: typeof rawData.videos === 'string' ? JSON.parse(rawData.videos) : [],
      documents: typeof rawData.documents === 'string' ? JSON.parse(rawData.documents) : [],
      technicalSpecs: typeof rawData.technicalSpecs === 'string' ? JSON.parse(rawData.technicalSpecs) : undefined,
      tags: typeof rawData.tags === 'string' ? JSON.parse(rawData.tags) : [],
      priceSuggested: rawData.priceSuggested ? parseFloat(rawData.priceSuggested as string) : undefined,
      priceReferenceMin: rawData.priceReferenceMin ? parseFloat(rawData.priceReferenceMin as string) : undefined,
      priceReferenceMax: rawData.priceReferenceMax ? parseFloat(rawData.priceReferenceMax as string) : undefined,
      defaultMarginPercent: rawData.defaultMarginPercent ? parseFloat(rawData.defaultMarginPercent as string) : undefined,
      isFeatured: rawData.isFeatured === 'true',
    };

    const validatedData = CreateCatalogItemSchema.parse(parsedData);
    
    // Spread ensure optional properties are omitted if undefined (for exactOptionalPropertyTypes)
    const itemData = {
      ...validatedData,
      ...(validatedData.slug ? { slug: validatedData.slug } : {}),
      ...(validatedData.description ? { description: validatedData.description } : {}),
    };

    const service = await getCatalogService();
    const result = await service.createItem(itemData as any);

    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    const item = result.getValue();

    revalidatePath('/admin/catalog');
    revalidatePath('/servicios');
    revalidatePath('/');

    return { success: true, data: item };
  } catch (error) {
    logger.error('Error en createCatalogItemAction:', error);
    
    if (error instanceof ZodError) {
      return { 
        success: false, 
        error: 'Datos inválidos',
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al crear item' 
    };
  }
}

export async function updateCatalogItemAction(itemId: string, formData: FormData) {
  try {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: authResult.getError().message };
    }

    const rawData = Object.fromEntries(formData.entries());
    
    // Parsear campos JSON
    const parsedData = {
      ...rawData,
      images: typeof rawData.images === 'string' ? JSON.parse(rawData.images) : undefined,
      videos: typeof rawData.videos === 'string' ? JSON.parse(rawData.videos) : undefined,
      documents: typeof rawData.documents === 'string' ? JSON.parse(rawData.documents) : undefined,
      technicalSpecs: typeof rawData.technicalSpecs === 'string' ? JSON.parse(rawData.technicalSpecs) : undefined,
      tags: typeof rawData.tags === 'string' ? JSON.parse(rawData.tags) : undefined,
      priceSuggested: rawData.priceSuggested ? parseFloat(rawData.priceSuggested as string) : undefined,
      priceReferenceMin: rawData.priceReferenceMin ? parseFloat(rawData.priceReferenceMin as string) : undefined,
      priceReferenceMax: rawData.priceReferenceMax ? parseFloat(rawData.priceReferenceMax as string) : undefined,
      defaultMarginPercent: rawData.defaultMarginPercent ? parseFloat(rawData.defaultMarginPercent as string) : undefined,
      isFeatured: rawData.isFeatured ? rawData.isFeatured === 'true' : undefined,
    };

    // Remover undefined values
    Object.keys(parsedData).forEach(key => {
      if (parsedData[key as keyof typeof parsedData] === undefined) {
        delete parsedData[key as keyof typeof parsedData];
      }
    });

    const validatedData = UpdateCatalogItemSchema.parse(parsedData);
    
    // exactOptionalPropertyTypes compliance: Spread ONLY defined properties
    const updateData = {
      ...validatedData
    };
    
    const service = await getCatalogService();
    const result = await service.updateItem(itemId, updateData as any);

    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    const item = result.getValue();

    revalidatePath('/admin/catalog');
    revalidatePath(`/servicios/${item.slug}`);
    revalidatePath('/servicios');
    revalidatePath('/');

    return { success: true, data: item };
  } catch (error) {
    logger.error('Error en updateCatalogItemAction:', error);
    
    if (error instanceof ZodError) {
      return { 
        success: false, 
        error: 'Datos inválidos',
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar item' 
    };
  }
}

export async function publishCatalogItemAction(itemId: string) {
  try {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: authResult.getError().message };
    }

    const service = await getCatalogService();
    const result = await service.publishItem(itemId);

    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/admin/catalog');
    revalidatePath('/servicios');
    revalidatePath('/');

    return { success: true, data: result.getValue() };
  } catch (error) {
    logger.error('Error en publishCatalogItemAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al publicar item' 
    };
  }
}

export async function unpublishCatalogItemAction(itemId: string) {
  try {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: authResult.getError().message };
    }

    const service = await getCatalogService();
    const result = await service.unpublishItem(itemId);

    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/admin/catalog');
    revalidatePath('/servicios');
    revalidatePath('/');

    return { success: true, data: result.getValue() };
  } catch (error) {
    logger.error('Error en unpublishCatalogItemAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al despublicar item' 
    };
  }
}

export async function archiveCatalogItemAction(itemId: string) {
  try {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: authResult.getError().message };
    }

    const service = await getCatalogService();
    const result = await service.archiveItem(itemId);

    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/admin/catalog');
    revalidatePath('/servicios');

    return { success: true, data: result.getValue() };
  } catch (error) {
    logger.error('Error en archiveCatalogItemAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al archivar item' 
    };
  }
}

export async function deleteCatalogItemAction(itemId: string) {
  try {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: authResult.getError().message };
    }

    const service = await getCatalogService();
    const result = await service.deleteItem(itemId);

    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/admin/catalog');
    revalidatePath('/servicios');

    return { success: true };
  } catch (error) {
    logger.error('Error en deleteCatalogItemAction:', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al eliminar item' 
    };
  }
}

// ============ CATEGORY ACTIONS ============

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).default(0),
  parentId: z.string().uuid().optional(),
});

export async function createCategoryAction(formData: FormData) {
  try {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: authResult.getError().message };
    }

    const rawData = Object.fromEntries(formData.entries());
    
    const parsedData = {
      ...rawData,
      order: rawData.order ? parseInt(rawData.order as string) : 0,
    };

    const validatedData = CreateCategorySchema.parse(parsedData);
    
    // exactOptionalPropertyTypes compliance
    const categoryData = {
      name: validatedData.name,
      order: validatedData.order,
      ...(validatedData.slug ? { slug: validatedData.slug } : {}),
      ...(validatedData.description ? { description: validatedData.description } : {}),
      ...(validatedData.icon ? { icon: validatedData.icon } : {}),
      ...(validatedData.parentId ? { parentId: validatedData.parentId } : {}),
    };
    
    const service = await getCatalogService();
    const result = await service.createCategory(categoryData);

    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/admin/catalog');
    revalidatePath('/servicios');

    return { success: true, data: result.getValue() };
  } catch (error) {
    logger.error('Error en createCategoryAction:', error);
    
    if (error instanceof ZodError) {
      return { 
        success: false, 
        error: 'Datos inválidos',
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al crear categoría' 
    };
  }
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  try {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: authResult.getError().message };
    }

    const rawData = Object.fromEntries(formData.entries());
    
    const parsedData = {
      ...rawData,
      order: rawData.order ? parseInt(rawData.order as string) : undefined,
    };

    // Remover undefined values
    Object.keys(parsedData).forEach(key => {
      if (parsedData[key as keyof typeof parsedData] === undefined) {
        delete parsedData[key as keyof typeof parsedData];
      }
    });

    const validatedData = CreateCategorySchema.partial().parse(parsedData);
    
    // exactOptionalPropertyTypes compliance
    const categoryUpdateData = {
      ...(validatedData.name ? { name: validatedData.name } : {}),
      ...(validatedData.slug ? { slug: validatedData.slug } : {}),
      ...(validatedData.description ? { description: validatedData.description } : {}),
      ...(validatedData.icon ? { icon: validatedData.icon } : {}),
      ...(validatedData.order !== undefined ? { order: validatedData.order } : {}),
    };
    
    const service = await getCatalogService();
    const result = await service.updateCategory(categoryId, categoryUpdateData as any);

    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    revalidatePath('/admin/catalog');
    revalidatePath('/servicios');

    return { success: true, data: result.getValue() };
  } catch (error) {
    logger.error('Error en updateCategoryAction:', error);
    
    if (error instanceof ZodError) {
      return { 
        success: false, 
        error: 'Datos inválidos',
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar categoría' 
    };
  }
}

// ============ QUERY ACTIONS ============

export async function getCatalogItems(filters?: {
  statusFilter?: 'active' | 'draft' | 'archived';
  typeFilter?: 'service' | 'product' | 'equipment';
}) {
  return getCatalogItemsAction(filters);
}

export async function getCatalogItemsAction(filters?: {
  statusFilter?: 'active' | 'draft' | 'archived';
  typeFilter?: 'service' | 'product' | 'equipment';
}) {
  try {
    const service = await getCatalogService();
    const result = await service.getAllItems(filters);
    
    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    return { success: true, data: result.getValue() };
  } catch (error) {
    logger.error('Error en getCatalogItemsAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener items' 
    };
  }
}

export async function getCatalogItemById(itemId: string) {
  return getCatalogItemByIdAction(itemId);
}

export async function getCatalogItemByIdAction(itemId: string) {
  try {
    const service = await getCatalogService();
    const result = await service.getItemDetail(itemId);
    
    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    const item = result.getValue();
    if (!item) {
      return { success: false, error: 'Item no encontrado' };
    }
    
    return { success: true, data: item };
  } catch (error) {
    logger.error('Error en getCatalogItemByIdAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener item' 
    };
  }
}

export async function getCatalogCategories() {
  return getCategoriesAction();
}

export async function getCategoriesAction() {
  try {
    const service = await getCatalogService();
    const result = await service.getAllCategories();
    
    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    return { success: true, data: result.getValue() };
  } catch (error) {
    logger.error('Error en getCategoriesAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener categorías' 
    };
  }
}

export async function getCatalogStatisticsAction() {
  try {
    const service = await getCatalogService();
    const result = await service.getStatistics();
    
    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    return { success: true, data: result.getValue() };
  } catch (error) {
    logger.error('Error en getCatalogStatisticsAction:', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener estadísticas' 
    };
  }
}

// ============ AI ACTIONS ============

export async function generateMarketingAction(itemId: string) {
  try {
    const authResult = await requireRole(UserRole.ADMIN);
    if (authResult.isFailure()) {
      return { success: false, error: authResult.getError().message };
    }

    const service = await getCatalogService();
    // Resolve Marketing Agent from container and inject manually since getCatalogService 
    // manually creates the repository for now.
    // In a full DI world, we would resolve CatalogService directly.
    const container = await getContainer();
    const marketingAgent = await container.resolve<any>(DI_KEYS.MarketingGeniusAgent);
    
    // Patch the service with the agent if it's missing (needed because getCatalogService factory)
    if (!(service as any).marketingAgent) {
      (service as any).marketingAgent = marketingAgent;
    }

    const result = await service.generateServiceMarketing(itemId);
    
    if (result.isFailure()) {
      return { success: false, error: result.getError().message };
    }

    return { success: true, data: result.getValue() };
  } catch (error) {
    logger.error('Error en generateMarketingAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al generar marketing con IA' 
    };
  }
}
