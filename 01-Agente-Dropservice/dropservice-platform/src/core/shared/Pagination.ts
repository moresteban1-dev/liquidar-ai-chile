import { Result, ok, fail } from './Result'

/**
 * PaginationParams - Pagination input from user
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * PaginatedResult - Standardized paginated response
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

/**
 * Pagination - Utility for calculating offsets and mapping results
 */
export class Pagination {
  readonly page: number
  readonly pageSize: number
  readonly offset: number
  readonly sortBy: string
  readonly sortOrder: 'asc' | 'desc'

  private constructor(
    page: number,
    pageSize: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ) {
    this.page = page
    this.pageSize = pageSize
    this.offset = (page - 1) * pageSize
    this.sortBy = sortBy
    this.sortOrder = sortOrder
  }

  public static create(params: PaginationParams = {}): Result<Pagination, string> {
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20
    const sortBy = params.sortBy ?? 'created_at'
    const sortOrder = params.sortOrder ?? 'desc'

    if (page < 1) {
      return fail('Page must be >= 1')
    }

    if (pageSize < 1 || pageSize > 100) {
      return fail('Page size must be between 1 and 100')
    }

    const validSortOrders = ['asc', 'desc']
    if (!validSortOrders.includes(sortOrder)) {
      return fail('Sort order must be asc or desc')
    }

    return ok(new Pagination(page, pageSize, sortBy, sortOrder))
  }

  public toResult<T>(data: T[], total: number): PaginatedResult<T> {
    const totalPages = Math.ceil(total / this.pageSize)

    return {
      data,
      pagination: {
        page: this.page,
        pageSize: this.pageSize,
        total,
        totalPages,
        hasNextPage: this.page < totalPages,
        hasPreviousPage: this.page > 1
      }
    }
  }
}
