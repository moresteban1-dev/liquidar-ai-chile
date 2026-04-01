import { PaginationParams } from '@/core/shared/Pagination'

/**
 * ListOrdersByProviderQuery
 */
export interface ListOrdersByProviderQuery {
  providerId: string
  filters?: {
    state?: string | undefined
    activeOnly?: boolean | undefined
  }
  pagination?: PaginationParams
}
