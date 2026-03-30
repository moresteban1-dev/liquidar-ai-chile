import { Result } from '@shared/Result';
import { AppError } from '@shared/AppError';
import { 
  CatalogCategory, 
  CatalogItem, 
  CatalogFilters, 
  CreateCatalogItemData, 
  UpdateCatalogItemData,
  CreateCatalogCategoryData,
  UpdateCatalogCategoryData
} from '../../domain/catalog/CatalogTypes';

/**
 * ICatalogRepository
 * 
 * Puerto de catálogo unificado. Define todas las operaciones de persistencia
 * necesarias para el CatalogService y las acciones de servidor.
 * Utiliza Result<T, AppError> para cumplimiento hexagonal enterprise.
 */
export interface ICatalogRepository {
    /**
     * Retrieves categories based on filters.
     */
    getCategories(filters?: { statusFilter?: string }): Promise<Result<CatalogCategory[], AppError>>;

    /**
     * Retrieves a single category by its ID.
     */
    getCategoryById(id: string): Promise<Result<CatalogCategory | null, AppError>>;

    /**
     * Retrieves a single category by its unique slug.
     */
    getCategoryBySlug(slug: string): Promise<Result<CatalogCategory | null, AppError>>;

    /**
     * Retrieves catalog items based on provided filters.
     */
    getItems(filters?: CatalogFilters): Promise<Result<CatalogItem[], AppError>>;

    /**
     * Search for items using a query.
     */
    searchItems(query: string, filters?: CatalogFilters): Promise<Result<CatalogItem[], AppError>>;

    /**
     * Retrieves items marked as featured.
     */
    getFeaturedItems(limit: number): Promise<Result<CatalogItem[], AppError>>;

    /**
     * Retrieves a detailed catalog item by its unique slug.
     */
    getItemBySlug(slug: string): Promise<Result<CatalogItem | null, AppError>>;

    /**
     * Retrieves a detailed catalog item by its ID.
     */
    getItemById(id: string): Promise<Result<CatalogItem | null, AppError>>;

    /**
     * Creates a new catalog item.
     */
    createItem(data: CreateCatalogItemData): Promise<Result<CatalogItem, AppError>>;

    /**
     * Updates an existing catalog item.
     */
    updateItem(id: string, data: UpdateCatalogItemData): Promise<Result<CatalogItem, AppError>>;

    /**
     * Deletes a catalog item by ID.
     */
    deleteItem(id: string): Promise<Result<void, AppError>>;

    /**
     * Creates a new category.
     */
    createCategory(data: CreateCategoryData): Promise<Result<CatalogCategory, AppError>>;

    /**
     * Updates an existing category.
     */
    updateCategory(id: string, data: UpdateCategoryData): Promise<Result<CatalogCategory, AppError>>;

    /**
     * Deletes a catalog category by ID.
     */
    deleteCategory(id: string): Promise<Result<void, AppError>>;
}

// Support for nested types if needed by implementation
export type CreateCategoryData = CreateCatalogCategoryData;
export type UpdateCategoryData = UpdateCatalogCategoryData;
