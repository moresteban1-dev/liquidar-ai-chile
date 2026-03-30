import { PaginationParams } from '@/core/shared/Pagination'

/**
 * ListQuotationsByOrderQuery
 */
export interface ListQuotationsByOrderQuery {
  orderId: string
  filters?: {
    status?: string | undefined
    providerId?: string | undefined
  }
  pagination?: PaginationParams
}
