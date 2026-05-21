export type ItemType = 'SERVICE' | 'EQUIPMENT' | 'PERMIT' | 'MIXED' | 'service' | 'product' | 'equipment';
export type CatalogItemType = ItemType;
export type CatalogStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'draft' | 'active' | 'archived';
export type PricingModel = 'FIXED' | 'PER_UNIT' | 'PER_HOUR' | 'PER_DAY' | 'PER_PERSON' | 'PER_SQM' | 'PER_LM' | 'CUSTOM' | 'fixed' | 'per_unit';

export interface CatalogCategory {
    id: string;
    parentId: string | null;
    code: string;
    name: string;
    slug: string;
    level: 1 | 2 | 3;
    path: string[];
    itemType: ItemType;
    icon: string | null;
    status: CatalogStatus;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface MediaAsset {
    url: string;
    altText?: string;
    caption?: string;
    type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'image' | 'video' | 'document';
    order: number;
}

export interface CatalogItem {
    id: string;
    categoryId: string;
    legacyServiceId: string | null;
    itemType: ItemType;
    type?: ItemType; // Alias for compatibility with CatalogService
    code: string;
    sku: string | null;
    name: string;
    slug: string;
    description?: string; // Alias for compatibility
    shortDescription: string | null;
    fullDescription: string | null;
    technicalSpecs: Record<string, unknown>;
    pricingModel: PricingModel;
    unitLabel: string;
    priceReferenceMin: number | null;
    priceReferenceMax: number | null;
    priceSuggested: number | null;
    defaultMarginPercent: number | null;
    minMarginPercent: number | null;
    images: MediaAsset[];
    videos: MediaAsset[];
    documents: MediaAsset[];
    tags: string[];
    status: CatalogStatus;
    isFeatured: boolean;
    isPopular: boolean;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
    priceType?: 'FIJO' | 'COTIZABLE' | 'DESDE';
    // Optional joined data from relations
    category?: Pick<CatalogCategory, 'id' | 'name' | 'slug'>;
}

export interface CreateCatalogItemData {
  name: string;
  slug?: string;
  type: ItemType;
  categoryId: string;
  description?: string;
  priceSuggested?: number;
  priceReferenceMin?: number;
  priceReferenceMax?: number;
  defaultMarginPercent?: number;
  images?: MediaAsset[];
  videos?: MediaAsset[];
  documents?: MediaAsset[];
  technicalSpecs?: Record<string, unknown>;
  tags?: string[];
  status?: CatalogStatus;
  isFeatured?: boolean;
  priceType?: 'FIJO' | 'COTIZABLE' | 'DESDE';
}

export type UpdateCatalogItemData = Partial<CreateCatalogItemData>;

export interface CreateCatalogCategoryData {
  name: string;
  slug?: string;
  code?: string;
  parentId?: string | null;
  level: 1 | 2 | 3;
  description?: string;
  displayOrder?: number;
  itemType: ItemType;
  icon?: string | null;
  status?: CatalogStatus;
}

export type UpdateCatalogCategoryData = Partial<CreateCatalogCategoryData>;

// Parameters for querying the catalog
export interface CatalogFilters {
    search?: string;
    categoryId?: string;
    itemType?: ItemType;
    typeFilter?: ItemType; // Compatibility
    status?: CatalogStatus;
    statusFilter?: CatalogStatus; // Compatibility
    isFeatured?: boolean;
    isPopular?: boolean;
    tags?: string[];
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
}
