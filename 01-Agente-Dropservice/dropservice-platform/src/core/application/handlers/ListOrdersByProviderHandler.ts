import { Result, Success, Failure } from '@/core/shared/Result'
import { InstrumentedHandler } from '../shared/InstrumentedHandler'
import { IOrderRepository } from '@app/ports/IOrderRepository'
import { Pagination, PaginatedResult } from '@/core/shared/Pagination'
import { OrderSummaryDTO } from './ListOrdersByClientHandler'
import { PaginationParams } from '@/core/shared/Pagination'

export interface ListOrdersByProviderQuery {
  providerId: string
  filters?: {
    state?: string
    activeOnly?: boolean
  }
  pagination?: PaginationParams
}

export class ListOrdersByProviderHandler
  extends InstrumentedHandler<ListOrdersByProviderQuery, PaginatedResult<OrderSummaryDTO>> {

  protected handlerName = 'ListOrdersByProvider'
  protected operationType = 'query' as const

  constructor(private readonly orderRepository: IOrderRepository) {
    super()
  }

  protected async handle(
    query: ListOrdersByProviderQuery
  ): Promise<Result<PaginatedResult<OrderSummaryDTO>, string>> {
    if (!query.providerId || query.providerId.trim().length === 0) {
      return new Failure('Provider ID is required')
    }

    const paginationResult = Pagination.create(query.pagination)
    if (paginationResult.isFailure()) return new Failure(paginationResult.error)

    const pagination = paginationResult.value

    const queryResult = await this.orderRepository.query({
      filters: {
        providerId: query.providerId,
        state: query.filters?.state,
        activeOnly: query.filters?.activeOnly
      },
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder
    })

    if (queryResult.isFailure()) return queryResult as any

    const { data: orders, total } = queryResult.value

    const dtos: OrderSummaryDTO[] = orders.map(order => ({
      id: order.orderId.toString(),
      clientId: order.clientId.toString(),
      providerId: order.providerId?.toString(),
      state: order.state,
      eventDate: order.eventDate.toISOString(),
      eventType: order.props.eventType,
      estimatedGuests: order.props.estimatedGuests,
      deliveryAddress: order.deliveryAddress,
      pricing: order.pricing ? {
        finalPrice: order.pricing.providerCost.amount,
        currency: order.pricing.providerCost.currency
      } : undefined,
      isActive: order.isActive,
      isPaid: order.isPaid,
      daysUntilEvent: order.daysUntilEvent,
      createdAt: order.createdAt.toISOString()
    }))

    return new Success(pagination.toResult(dtos, total))
  }

  protected extractSpanAttributes(query: ListOrdersByProviderQuery) {
    return { 'query.provider_id': query.providerId }
  }
}
