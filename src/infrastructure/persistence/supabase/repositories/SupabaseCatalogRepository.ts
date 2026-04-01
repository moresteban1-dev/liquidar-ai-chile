import { ICatalogRepository } from '@app/ports/ICatalogRepository';
import { Result } from '@core/shared/Result';
import { CatalogItemMapper } from '../mappers/CatalogItemMapper';
import { CatalogCategoryMapper } from '../mappers/CatalogCategoryMapper';
import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@shared/AppError';
import { 
  CatalogCategory, 
  CatalogItem, 
  CatalogFilters, 
  CreateCatalogItemData, 
  UpdateCatalogItemData,
  CreateCatalogCategoryData,
  UpdateCatalogCategoryData 
} from '@core/domain/catalog/CatalogTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * SupabaseCatalogRepository
 * 
 * Implementación robusa de persistencia para el catálogo utilizando Supabase.
 * Soporta todas las operaciones de CRUD y consultas complejas para la plataforma.
 */
export class SupabaseCatalogRepository implements ICatalogRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly itemMapper: CatalogItemMapper,
    private readonly categoryMapper: CatalogCategoryMapper
  ) {}

  // ============ CATEGORIES ============

  async getCategories(filters?: { statusFilter?: string }): Promise<Result<CatalogCategory[], AppError>> {
    try {
      let query = this.supabase
        .from('catalog_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (filters?.statusFilter) {
        query = query.eq('status', filters.statusFilter.toUpperCase());
      }

      const { data, error } = await query;
      if (error) return Result.fail(AppError.internal(error.message));

      const categories = (data || []).map(r => {
        const res = this.categoryMapper.toDomain(r);
        return res.isSuccess() ? res.getValue() : null;
      }).filter((c): c is CatalogCategory => c !== null);

      return Result.ok(categories);
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  async getCategoryById(id: string): Promise<Result<CatalogCategory | null, AppError>> {
    try {
      const { data, error } = await this.supabase
        .from('catalog_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return Result.ok(null);
        return Result.fail(AppError.internal(error.message));
      }

      const res = this.categoryMapper.toDomain(data);
      return res.isSuccess() ? Result.ok(res.getValue()) : Result.fail(AppError.internal(res.getError()));
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  async getCategoryBySlug(slug: string): Promise<Result<CatalogCategory | null, AppError>> {
    try {
      const { data, error } = await this.supabase
        .from('catalog_categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return Result.ok(null);
        return Result.fail(AppError.internal(error.message));
      }

      const res = this.categoryMapper.toDomain(data);
      return res.isSuccess() ? Result.ok(res.getValue()) : Result.fail(AppError.internal(res.getError()));
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  // ============ ITEMS ============

  async getItems(filters?: CatalogFilters): Promise<Result<CatalogItem[], AppError>> {
    try {
      let query = this.supabase
        .from('catalog_items')
        .select('*, category:catalog_categories(id, name, slug)')
        .order('display_order', { ascending: true });

      if (filters?.statusFilter) {
        query = query.eq('status', filters.statusFilter.toUpperCase());
      }
      if (filters?.typeFilter) {
        query = query.eq('item_type', filters.typeFilter.toUpperCase());
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) return Result.fail(AppError.internal(error.message));

      const items = (data || []).map(r => {
        const res = this.itemMapper.toDomain(r);
        return res.isSuccess() ? res.getValue() : null;
      }).filter((i): i is CatalogItem => i !== null);

      return Result.ok(items);
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  async searchItems(queryStr: string, filters?: CatalogFilters): Promise<Result<CatalogItem[], AppError>> {
    try {
      let query = this.supabase
        .from('catalog_items')
        .select('*, category:catalog_categories(id, name, slug)')
        .or(`name.ilike.%${queryStr}%,description.ilike.%${queryStr}%`);

      if (filters?.statusFilter) {
        query = query.eq('status', filters.statusFilter.toUpperCase());
      }

      const { data, error } = await query;
      if (error) return Result.fail(AppError.internal(error.message));

      const items = (data || []).map(r => {
        const res = this.itemMapper.toDomain(r);
        return res.isSuccess() ? res.getValue() : null;
      }).filter((i): i is CatalogItem => i !== null);

      return Result.ok(items);
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  async getFeaturedItems(limit: number): Promise<Result<CatalogItem[], AppError>> {
    return this.getItems({ isFeatured: true, limit, statusFilter: 'active' });
  }

  async getItemById(id: string): Promise<Result<CatalogItem | null, AppError>> {
    try {
      const { data, error } = await this.supabase
        .from('catalog_items')
        .select('*, category:catalog_categories(id, name, slug)')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return Result.ok(null);
        return Result.fail(AppError.internal(error.message));
      }

      const res = this.itemMapper.toDomain(data);
      return res.isSuccess() ? Result.ok(res.getValue() as any) : Result.fail(AppError.internal(res.getError()));
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  async getItemBySlug(slug: string): Promise<Result<CatalogItem | null, AppError>> {
    try {
      const { data, error } = await this.supabase
        .from('catalog_items')
        .select('*, category:catalog_categories(id, name, slug)')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return Result.ok(null);
        return Result.fail(AppError.internal(error.message));
      }

      const res = this.itemMapper.toDomain(data);
      return res.isSuccess() ? Result.ok(res.getValue() as any) : Result.fail(AppError.internal(res.getError()));
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  // ============ WRITE OPERATIONS ============

  async createItem(data: CreateCatalogItemData): Promise<Result<CatalogItem, AppError>> {
    try {
      const id = uuidv4();
      const code = `ITM-${Date.now()}`;
      
      const item: any = {
        ...data,
        id,
        code,
        status: data.status || 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const row = this.itemMapper.toPersistence(item);
      const { error } = await this.supabase
        .from('catalog_items')
        .insert(row);

      if (error) return Result.fail(AppError.internal(error.message));
      
      return this.getItemById(id) as any;
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  async updateItem(id: string, data: UpdateCatalogItemData): Promise<Result<CatalogItem, AppError>> {
    try {
      const existing = await this.getItemById(id);
      if (existing.isFailure()) return existing as any;
      if (!existing.getValue()) return Result.fail(AppError.notFound('CatalogItem', id));

      const updated = {
        ...existing.getValue(),
        ...data,
        updatedAt: new Date().toISOString()
      };

      const row = this.itemMapper.toPersistence(updated as any);
      const { error } = await this.supabase
        .from('catalog_items')
        .update(row)
        .eq('id', id);

      if (error) return Result.fail(AppError.internal(error.message));
      
      return this.getItemById(id) as any;
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  async deleteItem(id: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.supabase
        .from('catalog_items')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(AppError.internal(error.message));
      return Result.ok(undefined);
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  async createCategory(data: CreateCatalogCategoryData): Promise<Result<CatalogCategory, AppError>> {
    try {
      const id = uuidv4();
      const category: any = {
        ...data,
        id,
        status: data.status || 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const row = this.categoryMapper.toPersistence(category);
      const { error } = await this.supabase
        .from('catalog_categories')
        .insert(row);

      if (error) return Result.fail(AppError.internal(error.message));
      
      return this.getCategoryById(id) as any;
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  async updateCategory(id: string, data: UpdateCatalogCategoryData): Promise<Result<CatalogCategory, AppError>> {
    try {
      const existing = await this.getCategoryById(id);
      if (existing.isFailure()) return existing as any;
      if (!existing.getValue()) return Result.fail(AppError.notFound('CatalogCategory', id));

      const updated = {
        ...existing.getValue(),
        ...data,
        updatedAt: new Date().toISOString()
      };

      const row = this.categoryMapper.toPersistence(updated as any);
      const { error } = await this.supabase
        .from('catalog_categories')
        .update(row)
        .eq('id', id);

      if (error) return Result.fail(AppError.internal(error.message));
      
      return this.getCategoryById(id) as any;
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }

  async deleteCategory(id: string): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.supabase
        .from('catalog_categories')
        .delete()
        .eq('id', id);

      if (error) return Result.fail(AppError.internal(error.message));
      return Result.ok(undefined);
    } catch (e) {
      return Result.fail(AppError.from(e));
    }
  }
}
