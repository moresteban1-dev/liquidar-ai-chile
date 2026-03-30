import { Result, Success, Failure } from '@/core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { Pagination, PaginatedResult } from '@/core/shared/Pagination'
import { ListOrdersByClientQuery } from '../queries/ListOrdersByClientQuery'

export interface OrderSummaryDTO {
  id: string
  clientId: string
  providerId?: string
  state: string
  eventDate: string
  eventType?: string
  estimatedGuests?: number
  deliveryAddress: string
  pricing?: {
    finalPrice: number
    currency: string
  }
  isActive: boolean
  isPaid: boolean
  daysUntilEvent: number
  createdAt: string
}

export class ListOrdersByClientHandler
  extends InstrumentedHandler<ListOrdersByClientQuery, PaginatedResult<OrderSummaryDTO>> {

  protected handlerName = 'ListOrdersByClient'
  protected operationType = 'query' as const

  constructor(private readonly orderRepository: IOrderRepository) {
    super()
  }

  protected async handle(
    query: ListOrdersByClientQuery
  ): Promise<Result<PaginatedResult<OrderSummaryDTO>, string>> {
    if (!query.clientId || query.clientId.trim().length === 0) {
      return new Failure('Client ID is required')
    }

    const paginationResult = Pagination.create(query.pagination)
    if (paginationResult.isFailure()) return new Failure(paginationResult.error)

    const pagination = paginationResult.value

    const queryResult = await this.orderRepository.findByClientIdEnriched(
      query.clientId,
      {
        page: pagination.page,
        limit: pagination.pageSize,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder as any,
        ...(query.filters?.state ? { status: query.filters.state } : {})
      }
    )

    if (queryResult.isFailure()) return queryResult as any

    const { orders, total } = queryResult.value

    const dtos: OrderSummaryDTO[] = orders.map(order => {
      const dto: OrderSummaryDTO = {
        id: order.orderId.toString(),
        clientId: order.clientId.toString(),
        state: order.state,
        eventDate: (order as any).eventDate.toISOString(), // Temporally cast domain prop if needed
        eventType: (order.props as any).eventType,
        estimatedGuests: (order.props as any).estimatedGuests,
        deliveryAddress: (order as any).deliveryAddress,
        isActive: (order as any).isActive,
        isPaid: (order as any).isPaid,
        daysUntilEvent: (order as any).daysUntilEvent,
        createdAt: order.createdAt.toISOString(),
        pricing: (order as any).pricing ? {
          finalPrice: (order as any).pricing.finalPrice.amount,
          currency: (order as any).pricing.finalPrice.currency
        } : undefined,
        providerId: order.providerId ? order.providerId.toString() : undefined
      }

      return dto
    })

    return new Success(pagination.toResult(dtos, total))
  }

  protected extractSpanAttributes(query: ListOrdersByClientQuery) {
    return {
      'query.client_id': query.clientId,
      'query.page': query.pagination?.page || 1,
      'query.page_size': query.pagination?.pageSize || 20
    }
  }
}
