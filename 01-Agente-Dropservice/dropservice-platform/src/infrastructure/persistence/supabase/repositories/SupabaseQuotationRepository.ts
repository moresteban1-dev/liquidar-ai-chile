import { SupabaseClient } from '@supabase/supabase-js'
import { IQuotationRepository } from '@app/ports/IQuotationRepository'
import { Quotation } from '@core/domain/aggregates/quotation/Quotation'
import { UniqueEntityID } from '@core/shared/UniqueEntityID'
import { Result } from '@core/shared/Result'
import { AppError } from '@core/shared/AppError'
import { QuotationV2Mapper } from '../../mappers/QuotationV2Mapper'
import { logger } from '@infrastructure/telemetry/StructuredLogger'

/**
 * SupabaseQuotationRepository
 * 
 * Implementación concreta de IQuotationRepository usando Supabase (V2).
 * Maneja la persistencia del agregado Quotation con soporte para Money.
 */
export class SupabaseQuotationRepository implements IQuotationRepository {
  constructor(
    private readonly client: SupabaseClient
  ) {}

  async findById(id: UniqueEntityID): Promise<Result<Quotation | null, AppError>> {
    try {
      logger.debug('Buscando cotización por ID (Optimized Select)', { quotationId: id.toString() })

      // OPTIMIZACIÓN AAA: Única query para el agregado completo (Evita 4 roundtrips)
      const { data, error } = await this.client
        .from('quotations')
        .select(`
          *,
          requestedItems:quotation_requested_items(*),
          providerItems:quotation_provider_items(*),
          clientItems:quotation_client_items(*)
        `)
        .eq('id', id.toString())
        .is('deleted_at', null)
        .maybeSingle()

      if (error) {
        return Result.fail(AppError.internal(`Error de base de datos: ${error.message}`))
      }

      if (!data) return Result.ok(null);

      const domainRes = QuotationV2Mapper.toDomain(data as any);
      if (domainRes.isFailure()) {
          return Result.fail(AppError.internal(domainRes.getError()));
      }
      return Result.ok(domainRes.getValue());

    } catch (error) {
      logger.error('Excepción inesperada al buscar cotización', error as Error)
      return Result.fail(AppError.from(error))
    }
  }

  async save(quotation: Quotation): Promise<Result<void, AppError>> {
    try {
      logger.debug('Guardando cotización', { quotationId: quotation.quotationId.toString() })

      const persistenceRes = QuotationV2Mapper.toPersistence(quotation);
      if (persistenceRes.isFailure()) {
          return Result.fail(AppError.internal(persistenceRes.getError()));
      }
      const persistenceData = persistenceRes.getValue();

      // 1. Save Core Table
      const { error: qError } = await this.client
        .from('quotations')
        .upsert(persistenceData.quotation);

      if (qError) return Result.fail(AppError.internal(`Error al guardar cotización: ${qError.message}`));

      // 2. Save Related Items (Surgical Upsert)
      if (persistenceData.requestedItems && persistenceData.requestedItems.length > 0) {
        await this.client.from('quotation_requested_items').upsert(persistenceData.requestedItems);
      }
      if (persistenceData.providerItems && persistenceData.providerItems.length > 0) {
        await this.client.from('quotation_provider_items').upsert(persistenceData.providerItems);
      }
      if (persistenceData.clientItems && persistenceData.clientItems.length > 0) {
        await this.client.from('quotation_client_items').upsert(persistenceData.clientItems);
      }

      return Result.ok(undefined)

    } catch (error) {
      logger.error('Excepción inesperada al guardar cotización', error as Error)
      return Result.fail(AppError.from(error))
    }
  }

  async findByOrder(orderId: UniqueEntityID): Promise<Result<Quotation[], AppError>> {
    try {
      // OPTIMIZACIÓN AAA: Eliminado N+1. Una sola query para todas las cotizaciones con sus ítems.
      const { data, error } = await this.client
        .from('quotations')
        .select(`
          *,
          requestedItems:quotation_requested_items(*),
          providerItems:quotation_provider_items(*),
          clientItems:quotation_client_items(*)
        `)
        .eq('service_id', orderId.toString())
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) return Result.fail(AppError.internal(`Error de base de datos: ${error.message}`))

      const quotations: Quotation[] = []
      for (const record of data || []) {
        const res = QuotationV2Mapper.toDomain(record as any);
        if (res.isSuccess() && res.getValue()) {
          quotations.push(res.getValue()!);
        }
      }

      return Result.ok(quotations)
    } catch (error) {
      return Result.fail(AppError.from(error))
    }
  }

  async findByProvider(providerId: UniqueEntityID): Promise<Result<Quotation[], AppError>> {
    try {
      // OPTIMIZACIÓN AAA: Eliminado N+1. Consulta atómica con joins.
      const { data, error } = await this.client
        .from('quotations')
        .select(`
          *,
          requestedItems:quotation_requested_items(*),
          providerItems:quotation_provider_items(*),
          clientItems:quotation_client_items(*)
        `)
        .eq('assigned_provider_id', providerId.toString())
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) return Result.fail(AppError.internal(`Error de base de datos: ${error.message}`))

      const quotations: Quotation[] = []
      for (const record of data || []) {
        const res = QuotationV2Mapper.toDomain(record as any);
        if (res.isSuccess() && res.getValue()) {
          quotations.push(res.getValue()!);
        }
      }

      return Result.ok(quotations)
    } catch (error) {
      return Result.fail(AppError.from(error))
    }
  }

  async delete(id: UniqueEntityID): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.client
        .from('quotations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id.toString())

      if (error) return Result.fail(AppError.internal(`Error de base de datos: ${error.message}`))
      return Result.ok(undefined)
    } catch (error) {
      return Result.fail(AppError.from(error))
    }
  }

  async getClientEmail(clientId: string): Promise<Result<string | null, AppError>> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('email')
        .eq('id', clientId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return Result.ok(null)
        return Result.fail(AppError.internal(`Error al obtener email del cliente: ${error.message}`))
      }
      return Result.ok(data?.email || null)
    } catch (error) {
      return Result.fail(AppError.from(error))
    }
  }

  async getClientQuotationView(quotationId: string, clientId: string): Promise<Result<any, AppError>> {
    try {
        const { data, error } = await this.client
            .from('quotations')
            .select(`
                id, code, status, brief,
                total_net, total_iva, total_with_iva, valid_until, created_at,
                event_start_date, event_address, event_end_time,
                service:services(name, description, image_url)
            `)
            .eq('id', quotationId)
            .eq('client_id', clientId)
            .single();

        if (error || !data) return Result.fail(AppError.notFound('Cotización', quotationId));
        return Result.ok(data);
    } catch (error) {
        return Result.fail(AppError.from(error));
    }
  }

    async getAdminQuotationView(quotationId: string): Promise<Result<any, AppError>> {
        try {
            const { data, error } = await this.client
                .from('quotations')
                .select(`
                    *,
                    client:profiles!quotations_client_id_fkey(id, name, phone),
                    service:services(name, description, image_url),
                    requested_items:quotation_requested_items(*),
                    provider_items:quotation_provider_items(*),
                    client_items:quotation_client_items(*),
                    provider_bids(*, provider:profiles(*, provider_profiles(*)))
                `)
                .eq('id', quotationId)
                .single();

            if (error || !data) return Result.fail(AppError.notFound('Cotización', quotationId));
            return Result.ok(data);
        } catch (error) {
            return Result.fail(AppError.from(error));
        }
    }

    async updateInternalNotes(quotationId: string, notes: string): Promise<Result<void, AppError>> {
        try {
            const { error } = await this.client
                .from('quotations')
                .update({ internal_notes: notes })
                .eq('id', quotationId);

            if (error) return Result.fail(AppError.internal(`Error al actualizar notas: ${error.message}`));
            return Result.ok(undefined);
        } catch (error) {
            return Result.fail(AppError.from(error));
        }
    }
}
