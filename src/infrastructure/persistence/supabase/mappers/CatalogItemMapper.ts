import { Result } from '@core/shared/Result';
import { CatalogItem, MediaAsset } from '@core/domain/catalog/CatalogTypes';

export interface CatalogItemRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  full_description?: string;
  category_id: string;
  item_type: string;
  pricing_model: string;
  unit_label: string;
  price_reference_min?: number;
  price_reference_max?: number;
  price_suggested?: number;
  code: string;
  sku?: string;
  status: string;
  is_featured: boolean;
  is_popular?: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;

  // V2 flat database columns
  technical_specs?: Record<string, any>;
  tags?: string[];
  images?: MediaAsset[];
  videos?: MediaAsset[];
  documents?: MediaAsset[];
  legacy_service_id?: string | null;
  default_margin_percent?: number | null;
  min_margin_percent?: number | null;
}

export class CatalogItemMapper {
  public toDomain(row: CatalogItemRow): Result<CatalogItem> {
    const item: CatalogItem = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.description || row.short_description || null,
      fullDescription: row.description || row.full_description || null,
      categoryId: row.category_id,
      itemType: row.item_type.toLowerCase() as any,
      type: row.item_type.toLowerCase() as any,
      pricingModel: row.pricing_model?.toUpperCase() as any || 'FIXED',
      unitLabel: row.unit_label || 'Unit',
      priceReferenceMin: row.price_reference_min ?? null,
      priceReferenceMax: row.price_reference_max ?? null,
      priceSuggested: row.price_suggested ?? row.price_reference_min ?? null,
      defaultMarginPercent: row.default_margin_percent ?? null,
      minMarginPercent: row.min_margin_percent ?? null,
      code: row.code,
      sku: row.sku ?? null,
      status: row.status.toLowerCase() as any,
      isFeatured: row.is_featured,
      isPopular: row.is_popular || false,
      displayOrder: row.display_order || 0,
      legacyServiceId: row.legacy_service_id ?? null,
      technicalSpecs: row.technical_specs || {},
      tags: row.tags || [],
      images: row.images || [],
      videos: row.videos || [],
      documents: row.documents || [],
      priceType: 'FIJO',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    if (row.description) {
      item.description = row.description;
    }

    return Result.ok(item);
  }

  public toPersistence(domain: CatalogItem): CatalogItemRow {
    const row: CatalogItemRow = {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      category_id: domain.categoryId,
      item_type: (domain.itemType || domain.type || 'SERVICE').toUpperCase(),
      pricing_model: (domain.pricingModel || 'FIXED').toUpperCase(),
      unit_label: domain.unitLabel || 'Unit',
      code: domain.code || domain.sku || domain.id,
      status: (domain.status || 'DRAFT').toUpperCase(),
      is_featured: domain.isFeatured || false,
      is_popular: domain.isPopular || false,
      display_order: domain.displayOrder || 0,
      created_at: domain.createdAt || new Date().toISOString(),
      updated_at: domain.updatedAt || new Date().toISOString(),
      
      // Direct flat V2 fields mapping
      technical_specs: domain.technicalSpecs || {},
      tags: domain.tags || [],
      images: domain.images || [],
      videos: domain.videos || [],
      documents: domain.documents || [],
      legacy_service_id: domain.legacyServiceId || null,
      default_margin_percent: domain.defaultMarginPercent || null,
      min_margin_percent: domain.minMarginPercent || null
    };

    if (domain.description || domain.shortDescription) {
      row.description = domain.description || domain.shortDescription || '';
      row.short_description = domain.shortDescription || domain.description || '';
      row.full_description = domain.fullDescription || domain.description || '';
    }
    if (domain.priceReferenceMin !== null && domain.priceReferenceMin !== undefined) {
      row.price_reference_min = domain.priceReferenceMin;
    }
    if (domain.priceReferenceMax !== null && domain.priceReferenceMax !== undefined) {
      row.price_reference_max = domain.priceReferenceMax;
    }
    if (domain.priceSuggested !== null && domain.priceSuggested !== undefined) {
      row.price_suggested = domain.priceSuggested;
    }
    if (domain.sku) {
      row.sku = domain.sku;
    }

    return row;
  }

  public toRow(domain: CatalogItem): CatalogItemRow {
    return this.toPersistence(domain);
  }
}
