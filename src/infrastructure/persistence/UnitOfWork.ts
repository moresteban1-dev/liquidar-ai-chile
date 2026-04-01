import { SupabaseClient } from '@supabase/supabase-js'
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger'

/**
 * UnitOfWork
 * 
 * Manages atomic operations. 
 * Note: Supabase/PostgREST atomicity is typically handled via individual requests 
 * or RPC functions. This class provides a bridge for multi-operation logic.
 */
export class UnitOfWork {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly logger: StructuredLogger
  ) {}

  async transaction<T>(work: (client: SupabaseClient) => Promise<T>): Promise<T> {
    const transactionId = crypto.randomUUID()
    this.logger.info('UnitOfWork transaction simulation started', { transactionId })

    try {
      // In Supabase, if we need true cross-table ACID, we use RPC.
      // Here we provide a context for consistency.
      const result = await work(this.supabase)
      this.logger.info('UnitOfWork operation completed', { transactionId })
      return result
    } catch (error) {
      this.logger.error('UnitOfWork operation failed', { transactionId, error })
      throw error
    }
  }

  /**
   * For true PostgreSQL transactions, use RPC to a stored procedure.
   */
  async transactionRPC<T>(fnName: string, params: any): Promise<T> {
    const { data, error } = await this.supabase.rpc(fnName, params)
    if (error) throw error
    return data as T
  }
}
