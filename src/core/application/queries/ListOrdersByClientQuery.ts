import { PaginationParams } from '@/core/shared/Pagination'

/**
 * ListOrdersByClientQuery
 */
export interface ListOrdersByClientQuery {
  clientId: string
  filters?: {
    state?: string | undefined
    eventDateFrom?: string | undefined
    eventDateTo?: string | undefined
    hasProvider?: boolean | undefined
  }
  pagination?: PaginationParams
}
