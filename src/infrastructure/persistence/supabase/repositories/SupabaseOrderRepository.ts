import { SupabaseClient } from '@supabase/supabase-js'
import {
  IOrderRepository,
  OrderQueryOptions,
  OrderQueryFilters,
  OrderListOptions,
  OrderListResult,
  EnrichedOrderDetail,
  DashboardStats
} from '@app/ports/IOrderRepository'
import { Order } from '@/core/domain/aggregates/order/Order'
import { UniqueEntityID } from '@/core/shared/UniqueEntityID'
import { Result } from '@/core/shared/Result'
import { AppError } from '@/core/shared/AppError'
import { OrderMapper } from '../mappers/OrderMapper'
import { instrumentedQuery } from './InstrumentedRepository'
import { logger } from '@/infrastructure/telemetry/StructuredLogger'

/**
 * NASA-Grade Engineering: Supabase Order Repository
 * 
 * Optimized for Type Safety and Clean Architecture.
 */
export class SupabaseOrderRepository implements IOrderRepository {
  constructor(
    private readonly client: SupabaseClient
  ) {}

  async findById(id: UniqueEntityID): Promise<Result<Order | null, AppError>> {
    return instrumentedQuery('SELECT', 'orders', async () => {
      const { data, error } = await this.client
        .from('orders')
        .select('*')
        .eq('id', id.toString())
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return Result.ok(null)
        return Result.fail(AppError.internal(`Database error: ${error.message}`))
      }

      const domainResult = OrderMapper.toDomain(data)
      if (domainResult.isFailure()) {
        return Result.fail(AppError.internal(domainResult.getError()))
      }

      return Result.ok(domainResult.getValue())
    })
  }

  async save(order: Order): Promise<Result<void, AppError>> {
    return instrumentedQuery('UPSERT', 'orders', async () => {
      const persistenceData = OrderMapper.toPersistence(order)

      const { error } = await this.client
        .from('orders')
        .upsert(persistenceData)

      if (error) return Result.fail(AppError.internal(`Database error: ${error.message}`))
      return Result.ok(undefined)
    })
  }

  async query(options: OrderQueryOptions): Promise<Result<{
    data: Order[]
    total: number
  }, AppError>> {
    return instrumentedQuery('QUERY', 'orders', async () => {
      const page = options.page || 1
      const pageSize = Math.min(options.pageSize || 20, 100)
      const offset = (page - 1) * pageSize
      const sortBy = options.sortBy || 'created_at'
      const sortOrder = options.sortOrder || 'desc'
      const ascending = sortOrder === 'asc'

      let query = this.client
        .from('orders')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

      if (options.filters) {
        query = this.applyFilters(query, options.filters)
      }

      query = query.order(sortBy, { ascending })
      query = query.range(offset, offset + pageSize - 1)

      const { data, error, count } = await query

      if (error) {
        logger.error('Query error', new Error(error.message), { filters: options.filters })
        return Result.fail(AppError.internal(`Database error: ${error.message}`))
      }

      const orders: Order[] = []
      for (const record of data || []) {
        const orderResult = OrderMapper.toDomain(record)
        if (orderResult.isSuccess()) orders.push(orderResult.getValue())
      }

      return Result.ok({ data: orders, total: count || 0 })
    })
  }

  private applyFilters(query: any, filters: OrderQueryFilters): any {
    if (filters.state) query = query.eq('status', filters.state)
    if (filters.clientId) query = query.eq('client_id', filters.clientId)
    if (filters.providerId) query = query.eq('provider_id', filters.providerId)
    if (filters.eventDateFrom) query = query.gte('event_date', filters.eventDateFrom.toISOString())
    if (filters.eventDateTo) query = query.lte('event_date', filters.eventDateTo.toISOString())
    if (filters.hasProvider === true) query = query.not('provider_id', 'is', null)
    else if (filters.hasProvider === false) query = query.is('provider_id', null)
    if (filters.activeOnly) query = query.not('status', 'in', '("COMPLETED","CANCELLED")')
    return query
  }

  async findByClientIdEnriched(
    clientId: string,
    options: OrderListOptions = {}
  ): Promise<Result<OrderListResult, AppError>> {
    return this.findEnriched({ ...options, clientId })
  }

  async findByProviderIdEnriched(
    providerId: string,
    options: OrderListOptions = {}
  ): Promise<Result<OrderListResult, AppError>> {
    return this.findEnriched({ ...options, providerId })
  }

  async findAllEnriched(
    options: OrderListOptions = {}
  ): Promise<Result<OrderListResult, AppError>> {
    return this.findEnriched(options)
  }

  private async findEnriched(
    filters: OrderListOptions & { clientId?: string; providerId?: string }
  ): Promise<Result<OrderListResult, AppError>> {
    return instrumentedQuery('SELECT_ENRICHED', 'orders', async () => {
      const limit = filters.limit || 20
      const page = filters.page || 1
      const offset = (page - 1) * limit
      const sortBy = filters.sortBy || 'created_at'
      const ascending = filters.sortOrder === 'asc'

      let query = this.client
        .from('orders')
        .select(`
          *,
          client:profiles!orders_client_id_fkey(full_name, email),
          provider:profiles!orders_provider_id_fkey(full_name, company_name)
        `, { count: 'exact' })
        .is('deleted_at', null)

      if (filters.clientId) query = query.eq('client_id', filters.clientId)
      if (filters.providerId) query = query.eq('provider_id', filters.providerId)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.dateFrom) query = query.gte('event_date', filters.dateFrom)
      if (filters.dateTo) query = query.lte('event_date', filters.dateTo)
      
      if (filters.activeOnly) {
        query = query.not('status', 'in', '("COMPLETED","CANCELLED")')
      }

      if (filters.search) {
        query = query.ilike('delivery_address', `%${filters.search}%`)
      }

      query = query
        .order(sortBy, { ascending })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) return Result.fail(AppError.internal(`Database error: ${error.message}`))

      const orders: Order[] = []
      for (const record of data || []) {
        const orderResult = OrderMapper.toDomain(record)
        if (orderResult.isSuccess()) {
          orders.push(orderResult.getValue())
        }
      }

      return Result.ok({
        orders,
        total: count || 0,
        limit,
        offset
      })
    })
  }

  async findByIdEnriched(id: string): Promise<Result<EnrichedOrderDetail | null, AppError>> {
    return instrumentedQuery('SELECT_DETAIL_ENRICHED', 'orders', async () => {
      const { data, error } = await this.client
        .from('orders')
        .select(`
          *,
          client:profiles!orders_client_id_fkey(full_name, email),
          provider:profiles!orders_provider_id_fkey(full_name, company_name, expertise),
          quotations(*)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return Result.ok(null)
        return Result.fail(AppError.internal(`Database error: ${error.message}`))
      }

      const orderResult = OrderMapper.toDomain(data)
      if (orderResult.isFailure()) return Result.fail(AppError.internal(orderResult.getError()))

      const detail: EnrichedOrderDetail = {
        order: orderResult.getValue(),
        client: data.client ? {
          name: data.client.full_name,
          email: data.client.email
        } : null,
        provider: data.provider ? {
          name: data.provider.full_name,
          company: data.provider.company_name
        } : null,
        quotations: (data.quotations || []).map((q: any) => {
          const price = q.price_amount || 0;
          const currency = q.price_currency || 'CLP';
          
          return {
            id: q.id,
            status: q.status,
            clientPrice: price,
            currency: currency,
            createdAt: q.created_at
          };
        })
      }

      return Result.ok(detail)
    })
  }

  async getDashboardStats(): Promise<Result<DashboardStats, AppError>> {
    return instrumentedQuery('GET_STATS', 'orders', async () => {
      const { data, error } = await this.client.rpc('get_dashboard_stats')

      if (error) return Result.fail(AppError.internal(`Database error: ${error.message}`))

      return Result.ok(data as DashboardStats)
    })
  }

  async findActiveOrdersByClient(clientId: UniqueEntityID): Promise<Result<Order[], AppError>> {
    const result = await this.query({ filters: { clientId: clientId.toString(), activeOnly: true }, pageSize: 100 })
    return result.map(r => r.data)
  }

  async findByProvider(providerId: UniqueEntityID): Promise<Result<Order[], AppError>> {
    const result = await this.query({ filters: { providerId: providerId.toString() }, pageSize: 100 })
    return result.map(r => r.data)
  }

  async findByState(state: string): Promise<Result<Order[], AppError>> {
    const result = await this.query({ filters: { state }, pageSize: 100 })
    return result.map(r => r.data)
  }

  async countActive(): Promise<Result<number, AppError>> {
    return instrumentedQuery('COUNT', 'orders', async () => {
      const { count, error } = await this.client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("COMPLETED","CANCELLED")')
        .is('deleted_at', null)
      if (error) return Result.fail(AppError.internal(`Database error: ${error.message}`))
      return Result.ok(count || 0)
    })
  }

  async delete(id: UniqueEntityID): Promise<Result<void, AppError>> {
    return instrumentedQuery('SOFT_DELETE', 'orders', async () => {
      const { error } = await this.client
        .from('orders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id.toString())
      if (error) return Result.fail(AppError.internal(`Database error: ${error.message}`))
      return Result.ok(undefined)
    })
  }

  async createFromQuotation(quotationId: string, price: number): Promise<Result<string, AppError>> {
    return instrumentedQuery('RPC', 'create_order_from_quotation', async () => {
      const { data, error } = await this.client.rpc('create_order_from_quotation', {
        p_quotation_id: quotationId,
        p_final_price: price
      })

      if (error) return Result.fail(AppError.internal(`Database error: ${error.message}`))
      return Result.ok(data as string)
    })
  }

  async getOrderWithBrief(orderId: string): Promise<Result<{
    id: string;
    quotationId: string;
    brief: string;
    requirements?: string;
  } | null, AppError>> {
    return instrumentedQuery('SELECT_BRIEF', 'orders', async () => {
      const { data, error } = await this.client
        .from('orders')
        .select(`
          id,
          quotation_id,
          deliverable_notes,
          quotations(brief)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return Result.ok(null)
        return Result.fail(AppError.internal(`Database error: ${error.message}`))
      }

      const quotations = data.quotations as any;
      const brief = Array.isArray(quotations) ? quotations[0]?.brief : (quotations?.brief || '');

      return Result.ok({
        id: data.id,
        quotationId: data.quotation_id,
        brief: brief,
        requirements: data.deliverable_notes
      })
    })
  }

  async updateInternalNotes(orderId: string, notes: string): Promise<Result<void, AppError>> {
    return instrumentedQuery('UPDATE_NOTES', 'orders', async () => {
      const { error } = await this.client
        .from('orders')
        .update({ internal_notes: notes })
        .eq('id', orderId)

      if (error) return Result.fail(AppError.internal(`Database error: ${error.message}`))
      return Result.ok(undefined)
    })
  }
}
