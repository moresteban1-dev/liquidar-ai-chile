import { SupabaseClient } from '@supabase/supabase-js';
import { IQuoteSessionRepository } from '@app/ports/IQuoteSessionRepository';
import { QuoteSession, QuoteItemRequested, QuoteOption } from '@/core/domain/quote/QuoteTypes';
import { Result, ok, fail } from '@/core/shared/Result';
import { AppError } from '@/core/shared/AppError';
import { logger } from '@/infrastructure/telemetry/StructuredLogger';

/**
 * SupabaseQuoteSessionRepository
 * 
 * Implementación concreta para Supabase de la persistencia de RFQs (V2).
 */
export class SupabaseQuoteSessionRepository implements IQuoteSessionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(session: QuoteSession): Promise<Result<string, AppError>> {
    try {
      const payload: any = {
          segment: session.segment,
          step_data: session.stepData,
          event_type: session.eventType,
          event_date: session.eventDate?.toISOString(),
          location: session.location,
          attendees: session.attendees,
          duration: session.duration,
          budget: session.budget,
          priorities: session.priorities,
          is_sustainable: session.isSustainable,
          needs_permits: session.needsPermits,
          client_data: session.clientData,
          status: session.status,
          updated_at: new Date().toISOString()
      };
      
      if (session.id) {
          payload.id = session.id;
      }

      const { data, error } = await this.supabase
        .from('v2_quote_sessions')
        .upsert(payload)
        .select('id')
        .single();

      if (error) return fail(AppError.internal(`Database error: ${error.message}`));
      return ok(data.id);

    } catch (error: any) {
      logger.error('Error salvando QuoteSession:', error);
      return fail(AppError.from(error));
    }
  }

  async addItems(sessionId: string, items: QuoteItemRequested[]): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.supabase
        .from('v2_quote_items_requested')
        .insert(items.map(item => ({
          session_id: sessionId,
          catalog_item_id: item.catalogItemId,
          is_custom: item.isCustom,
          custom_name: item.customName
        })));

      if (error) return fail(AppError.internal(`Database error: ${error.message}`));
      return ok(undefined);

    } catch (error: any) {
      logger.error('Error agregando ítems a QuoteSession:', error);
      return fail(AppError.from(error));
    }
  }

  async saveOptions(sessionId: string, options: QuoteOption[]): Promise<Result<void, AppError>> {
    try {
      const { error } = await this.supabase
        .from('v2_quote_options')
        .insert(options.map(opt => ({
          session_id: sessionId,
          option_type: opt.optionType,
          total_value: Math.round(opt.totalValue),
          margin_applied: opt.marginApplied,
          config_notes: opt.configNotes,
          included_catalog_items: opt.includedCatalogItems || []
        })));

      if (error) return fail(AppError.internal(`Database error saving options: ${error.message}`));
      return ok(undefined);

    } catch (error: any) {
      logger.error('Error guardando opciones de QuoteSession:', error);
      return fail(AppError.from(error));
    }
  }

  async findById(id: string): Promise<Result<QuoteSession | null, AppError>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_quote_sessions')
        .select('*, v2_quote_items_requested(*), v2_quote_options(*)')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return ok(null);
        return fail(AppError.internal(`Database error: ${error.message}`));
      }

      const session: QuoteSession = {
        id: data.id,
        segment: data.segment,
        stepData: data.step_data,
        eventType: data.event_type,
        eventDate: data.event_date ? new Date(data.event_date) : null,
        location: data.location,
        attendees: data.attendees,
        duration: data.duration,
        budget: data.budget,
        priorities: data.priorities,
        isSustainable: data.is_sustainable,
        needsPermits: data.needs_permits,
        clientData: data.client_data,
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        requestedItems: (data.v2_quote_items_requested || []).map((item: any) => ({
          id: item.id,
          sessionId: item.session_id,
          catalogItemId: item.catalog_item_id,
          isCustom: item.is_custom,
          customName: item.custom_name
        })),
        options: (data.v2_quote_options || []).map((opt: any) => ({
          id: opt.id,
          optionType: opt.option_type,
          totalValue: opt.total_value,
          marginApplied: opt.margin_applied,
          configNotes: opt.config_notes,
          includedCatalogItems: opt.included_catalog_items || []
        }))
      };

      return ok(session);

    } catch (error: any) {
      logger.error('Error buscando QuoteSession:', error);
      return fail(AppError.from(error));
    }
  }

  async listAll(filters?: { status?: string; segment?: string }): Promise<Result<QuoteSession[], AppError>> {
    try {
      let query = this.supabase
        .from('v2_quote_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.segment) {
        query = query.eq('segment', filters.segment);
      }

      const { data, error } = await query;

      if (error) return fail(AppError.internal(`Database error: ${error.message}`));

      const sessions: QuoteSession[] = (data || []).map((d: any) => ({
        id: d.id,
        segment: d.segment,
        stepData: d.step_data,
        eventType: d.event_type,
        eventDate: d.event_date ? new Date(d.event_date) : null,
        location: d.location,
        attendees: d.attendees,
        duration: d.duration,
        budget: d.budget,
        priorities: d.priorities,
        isSustainable: d.is_sustainable,
        needsPermits: d.needs_permits,
        clientData: d.client_data,
        status: d.status,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at)
      }));

      return ok(sessions);

    } catch (error: any) {
      logger.error('Error listando QuoteSessions:', error);
      return fail(AppError.from(error));
    }
  }
}
