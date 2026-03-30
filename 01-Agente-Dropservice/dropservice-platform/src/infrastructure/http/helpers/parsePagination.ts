import { PaginationParams } from '@/core/shared/Pagination'

/**
 * Parses pagination query params from URL
 */
export function parsePaginationFromURL(
  searchParams: URLSearchParams
): PaginationParams {
  const page = searchParams.get('page');
  const pageSize = searchParams.get('pageSize');
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');

  const result: PaginationParams = {};

  if (page) result.page = parseInt(page, 10);
  if (pageSize) result.pageSize = parseInt(pageSize, 10);
  if (sortBy) result.sortBy = sortBy;
  if (sortOrder) result.sortOrder = sortOrder as 'asc' | 'desc';

  return result;
}
