import { Result } from '@core/shared/Result';
import { CatalogItem, MediaAsset } from '@core/domain/catalog/CatalogTypes';

export interface CatalogItemMetadata {
  defaultMarginPercent?: number | null;
  legacyServiceId?: string | null;
  technicalSpecs?: Record<string, any>;
  tags?: string[];
  images?: MediaAsset[];
  videos?: MediaAsset[];
  documents?: MediaAsset[];
  priceType?: 'FIJO' | 'COTIZABLE' | 'DESDE';
}

export interface CatalogItemRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
  display_order: number;
  metadata?: CatalogItemMetadata;
  created_at: string;
  updated_at: string;
}

export class CatalogItemMapper {
  public toDomain(row: CatalogItemRow): Result<CatalogItem> {
    const item: CatalogItem = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.description || null,
      fullDescription: row.description || null,
      categoryId: row.category_id,
      itemType: row.item_type.toLowerCase() as any,
      type: row.item_type.toLowerCase() as any,
      pricingModel: row.pricing_model?.toUpperCase() as any || 'FIXED',
      unitLabel: row.unit_label || 'Unit',
      priceReferenceMin: row.price_reference_min ?? null,
      priceReferenceMax: row.price_reference_max ?? null,
      priceSuggested: row.price_suggested ?? row.price_reference_min ?? null,
      defaultMarginPercent: row.metadata?.defaultMarginPercent ?? null,
      minMarginPercent: null,
      code: row.code,
      sku: row.sku ?? null,
      status: row.status.toLowerCase() as any,
      isFeatured: row.is_featured,
      isPopular: false,
      displayOrder: row.display_order || 0,
      legacyServiceId: row.metadata?.legacyServiceId ?? null,
      technicalSpecs: row.metadata?.technicalSpecs || {},
      tags: row.metadata?.tags || [],
      images: row.metadata?.images || [],
      videos: row.metadata?.videos || [],
      documents: row.metadata?.documents || [],
      priceType: row.metadata?.priceType || 'FIJO',
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
      display_order: domain.displayOrder || 0,
      metadata: {
        technicalSpecs: domain.technicalSpecs || {},
        tags: domain.tags || [],
        images: domain.images || [],
        videos: domain.videos || [],
        documents: domain.documents || [],
        legacyServiceId: domain.legacyServiceId,
        defaultMarginPercent: domain.defaultMarginPercent,
        priceType: domain.priceType || 'FIJO'
      },
      created_at: domain.createdAt || new Date().toISOString(),
      updated_at: domain.updatedAt || new Date().toISOString()
    };

    if (domain.description || domain.shortDescription) {
      row.description = domain.description || domain.shortDescription || '';
    }
    if (domain.priceReferenceMin !== null && domain.priceReferenceMin !== undefined) {
      row.price_reference_min = domain.priceReferenceMin;
    }
    if (domain.priceReferenceMax !== null && domain.priceReferenceMax !== undefined) {
      row.price_reference_max = domain.priceReferenceMax;
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
