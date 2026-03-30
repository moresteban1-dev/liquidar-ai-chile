/**
 * Branded Types for Domain Integrity
 * Provides nominal typing for string IDs to prevent accidental mixing.
 */

export type Branded<T, TBrand> = T & { readonly _brand: TBrand };

export type QuotationId = Branded<string, 'QuotationId'>;
export type OrderId = Branded<string, 'OrderId'>;
export type CatalogItemId = Branded<string, 'CatalogItemId'>;
export type CategoryId = Branded<string, 'CategoryId'>;

/**
 * Type guards and creators
 */
export function createQuotationId(id: string): QuotationId {
  return id as QuotationId;
}

export function createOrderId(id: string): OrderId {
  return id as OrderId;
}

export function createCatalogItemId(id: string): CatalogItemId {
  return id as CatalogItemId;
}

export function createCategoryId(id: string): CategoryId {
  return id as CategoryId;
}
