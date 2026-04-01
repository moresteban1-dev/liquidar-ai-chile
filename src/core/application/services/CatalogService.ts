import { 
  CatalogItem, 
  CatalogCategory,
  CreateCatalogItemData, 
  UpdateCatalogItemData,
  CatalogItemType,
  CatalogFilters
} from '@core/domain/catalog/CatalogTypes';
import { ICatalogRepository } from '@core/application/ports/ICatalogRepository';
import { Result } from '@core/shared/Result';
import { AppError } from '@shared/AppError';
import { MarketingGeniusAgent } from '@infrastructure/ai/agents/MarketingGeniusAgent';

export interface CatalogLogger {
  info: (msg: string, data?: unknown) => void;
  error: (msg: string, data?: unknown) => void;
}

/**
 * CatalogService
 * 
 * Capa de aplicación que orquesta las operaciones del catálogo,
 * aplicando reglas de negocio y gestionando la persistencia a través del repositorio.
 * Implementa el Result Pattern para una gestión de errores NASA Grade.
 */
export class CatalogService {
  constructor(
    private repository: ICatalogRepository,
    private marketingAgent?: MarketingGeniusAgent,
    private logger?: CatalogLogger
  ) {}

  // ============ QUERIES (Lectura) ============
  
  async getActiveCategories(): Promise<Result<CatalogCategory[], AppError>> {
    return this.repository.getCategories({ statusFilter: 'active' });
  }

  async getAllCategories(): Promise<Result<CatalogCategory[], AppError>> {
    return this.repository.getCategories({});
  }

  async getCategoryById(categoryId: string): Promise<Result<CatalogCategory | null, AppError>> {
    return this.repository.getCategoryById(categoryId);
  }

  async searchItems(query: string, filters?: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    type?: CatalogItemType;
  }): Promise<Result<CatalogItem[], AppError>> {
    return this.repository.searchItems(query, filters);
  }

  async getItemDetail(itemId: string): Promise<Result<CatalogItem | null, AppError>> {
    return this.repository.getItemById(itemId);
  }

  async getItemBySlug(slug: string): Promise<Result<CatalogItem | null, AppError>> {
    return this.repository.getItemBySlug(slug);
  }

  async getFeaturedItems(limit: number = 6): Promise<Result<CatalogItem[], AppError>> {
    return this.repository.getFeaturedItems(limit);
  }

  async getPublishedServices(): Promise<Result<CatalogItem[], AppError>> {
    return this.repository.getItems({ 
      statusFilter: 'active',
      typeFilter: 'service' 
    });
  }

  async getItemsByCategory(categoryId: string, statusFilter?: 'active' | 'draft' | 'archived'): Promise<Result<CatalogItem[], AppError>> {
    const filters: CatalogFilters = { categoryId };
    if (statusFilter) filters.statusFilter = statusFilter;
    return this.repository.getItems(filters);
  }

  async getAllItems(filters?: {
    statusFilter?: 'active' | 'draft' | 'archived';
    typeFilter?: CatalogItemType;
  }): Promise<Result<CatalogItem[], AppError>> {
    return this.repository.getItems(filters || {});
  }

  // ============ COMMANDS (Escritura con Lógica de Negocio) ============
  
  async createItem(data: CreateCatalogItemData): Promise<Result<CatalogItem, AppError>> {
    const validation = this.validateBusinessRules(data);
    if (validation.isFailure()) return validation as any;
    
    if (!data.slug && data.name) {
      data.slug = this.generateSlug(data.name);
    }

    if (data.slug) {
      const slugResult = await this.repository.getItemBySlug(data.slug);
      if (slugResult.isSuccess() && slugResult.getValue()) {
        data.slug = `${data.slug}-${Date.now()}`;
      }
    }

    this.logger?.info('Creating catalog item', { name: data.name, type: data.type });

    const result = await this.repository.createItem(data);
    
    if (result.isSuccess()) {
      this.logger?.info('Catalog item created successfully', { itemId: result.getValue().id });
    }
    
    return result;
  }

  async updateItem(itemId: string, data: UpdateCatalogItemData): Promise<Result<CatalogItem, AppError>> {
    const existingResult = await this.repository.getItemById(itemId);
    if (existingResult.isFailure()) return existingResult;
    
    const existing = existingResult.getValue();
    if (!existing) {
      return Result.fail(AppError.notFound('CatalogItem', itemId));
    }

    if (data.type && data.type !== (existing as any).type) {
      return Result.fail(AppError.validation('No se puede cambiar el tipo de un item existente'));
    }

    if (data.name && !data.slug) {
      data.slug = this.generateSlug(data.name);
      const slugResult = await this.repository.getItemBySlug(data.slug);
      if (slugResult.isSuccess()) {
        const existingWithSlug = slugResult.getValue();
        if (existingWithSlug && existingWithSlug.id !== itemId) {
          data.slug = `${data.slug}-${Date.now()}`;
        }
      }
    }

    this.logger?.info('Updating catalog item', { itemId });
    return this.repository.updateItem(itemId, data);
  }

  async publishItem(itemId: string): Promise<Result<CatalogItem, AppError>> {
    const itemResult = await this.repository.getItemById(itemId);
    if (itemResult.isFailure()) return itemResult;
    
    const item = itemResult.getValue();
    if (!item) return Result.fail(AppError.notFound('CatalogItem', itemId));

    if (!item.images || item.images.length === 0) {
      return Result.fail(AppError.validation('El item debe tener al menos una imagen para ser publicado'));
    }

    if (!item.description || item.description.trim().length === 0) {
      return Result.fail(AppError.validation('El item debe tener una descripción para ser publicado'));
    }

    this.logger?.info('Publishing item', { itemId, name: item.name });
    return this.repository.updateItem(itemId, { status: 'active' });
  }

  async unpublishItem(itemId: string): Promise<Result<CatalogItem, AppError>> {
    const itemResult = await this.repository.getItemById(itemId);
    if (itemResult.isFailure()) return itemResult;
    
    const item = itemResult.getValue();
    if (!item) return Result.fail(AppError.notFound('CatalogItem', itemId));

    return this.repository.updateItem(itemId, { status: 'draft' });
  }

  async archiveItem(itemId: string): Promise<Result<CatalogItem, AppError>> {
    const itemResult = await this.repository.getItemById(itemId);
    if (itemResult.isFailure()) return itemResult;
    
    const item = itemResult.getValue();
    if (!item) return Result.fail(AppError.notFound('CatalogItem', itemId));

    return this.repository.updateItem(itemId, { status: 'archived' });
  }

  async deleteItem(itemId: string): Promise<Result<void, AppError>> {
    const itemResult = await this.repository.getItemById(itemId);
    if (itemResult.isFailure()) return itemResult as any;
    
    const item = itemResult.getValue();
    if (!item) return Result.fail(AppError.notFound('CatalogItem', itemId));

    if (item.status !== 'draft') {
      return Result.fail(AppError.validation('Solo se pueden eliminar items en estado borrador.'));
    }

    return this.repository.deleteItem(itemId);
  }

  async createCategory(data: any): Promise<Result<CatalogCategory, AppError>> {
    if (!data.slug) {
      data.slug = this.generateSlug(data.name);
    }
    return this.repository.createCategory(data);
  }

  async updateCategory(categoryId: string, data: any): Promise<Result<CatalogCategory, AppError>> {
    return this.repository.updateCategory(categoryId, data);
  }

  private validateBusinessRules(data: CreateCatalogItemData): Result<void, AppError> {
    if (!data.name || data.name.trim().length === 0) return Result.fail(AppError.validation('Nombre obligatorio'));
    if (!data.categoryId) return Result.fail(AppError.validation('Categoría obligatoria'));
    return Result.ok(undefined);
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  async getStatistics(): Promise<Result<any, AppError>> {
    const [allItemsR, categoriesR] = await Promise.all([
      this.repository.getItems({}),
      this.repository.getCategories({})
    ]);

    if (allItemsR.isFailure()) return allItemsR;
    if (categoriesR.isFailure()) return categoriesR;

    const allItems = allItemsR.getValue();
    const categories = categoriesR.getValue();

    return Result.ok({
      totalItems: allItems.length,
      activeItems: allItems.filter(i => i.status === 'active' || i.status === 'ACTIVE').length,
      draftItems: allItems.filter(i => i.status === 'draft' || i.status === 'DRAFT').length,
      archivedItems: allItems.filter(i => i.status === 'archived' || i.status === 'ARCHIVED').length,
      totalCategories: categories.length,
    });
  }

  // ============ AI MARKETING INTEGRATION ============

  /**
   * Generates SEO-optimized marketing content for a catalog item.
   * Following the "Audit & Approve" recommendation.
   */
  async generateServiceMarketing(itemId: string): Promise<Result<any, AppError>> {
    if (!this.marketingAgent) {
      return Result.fail(AppError.internal('Marketing Agent no configurado en CatalogService'));
    }

    const itemResult = await this.repository.getItemById(itemId);
    if (itemResult.isFailure()) return itemResult;
    
    const item = itemResult.getValue();
    if (!item) return Result.fail(AppError.notFound('CatalogItem', itemId));

    // Resolve category name for context
    const categoriesR = await this.repository.getCategories({});
    const category = categoriesR.isSuccess() 
      ? categoriesR.getValue().find(c => c.id === item.categoryId)
      : null;

    try {
      this.logger?.info('Generating AI Marketing for item', { itemId, name: item.name });
      
      const marketingData = await this.marketingAgent.execute({
        serviceName: item.name,
        categoryName: category?.name || 'General',
        description: item.description,
        targetAudience: 'Clientes corporativos y particulares buscando servicios de eventos'
      });

      // We return the data but DON'T save it automatically (Audit & Approve strategy)
      return Result.ok(marketingData);
    } catch (error) {
      this.logger?.error('Error generating AI Marketing', { itemId, error });
      return Result.fail(AppError.internal('Error al generar marketing con IA'));
    }
  }
}
