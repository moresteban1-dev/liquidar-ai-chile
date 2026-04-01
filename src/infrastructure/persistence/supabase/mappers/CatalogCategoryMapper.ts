import { Result } from '@core/shared/Result';
import { CatalogCategory } from '@core/domain/catalog/CatalogTypes';

export interface CatalogCategoryRow {
  id: string;
  name: string;
  slug: string;
  code: string;
  description?: string;
  parent_id: string | null;
  level: number;
  display_order: number;
  item_type: string;
  status: string;
  path?: string[];
  icon?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export class CatalogCategoryMapper {
  public toDomain(row: CatalogCategoryRow): Result<CatalogCategory> {
    const category: CatalogCategory = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      code: row.code || row.slug,
      parentId: row.parent_id,
      level: row.level as 1 | 2 | 3,
      displayOrder: row.display_order,
      itemType: (row.item_type?.toLowerCase() || 'service') as any,
      status: row.status.toLowerCase() as any,
      path: row.path || [],
      icon: row.icon || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    return Result.ok(category);
  }

  public toPersistence(domain: CatalogCategory): CatalogCategoryRow {
    const row: CatalogCategoryRow = {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      code: domain.code || domain.slug,
      parent_id: domain.parentId,
      level: domain.level || 1,
      display_order: domain.displayOrder || 0,
      item_type: (domain.itemType || 'SERVICE').toUpperCase(),
      status: (domain.status || 'DRAFT').toUpperCase(),
      created_at: domain.createdAt || new Date().toISOString(),
      updated_at: domain.updatedAt || new Date().toISOString()
    };

    if (domain.path) row.path = domain.path;
    if (domain.icon) row.icon = domain.icon;

    return row;
  }

  public toRow(domain: CatalogCategory): CatalogCategoryRow {
    return this.toPersistence(domain);
  }
}
