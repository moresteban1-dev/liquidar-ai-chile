import { SupabaseClient } from '@supabase/supabase-js';
import { IQuoteSessionRepository } from '@app/ports/IQuoteSessionRepository';
import { QuoteSession, QuoteItemRequested } from '@/core/domain/quote/QuoteTypes';
import { Result, ok, fail } from '@/core/shared/Result';
import { logger } from '@/infrastructure/telemetry/StructuredLogger';

/**
 * SupabaseQuoteSessionRepository
 * 
 * Implementación concreta para Supabase de la persistencia de RFQs (V2).
 */
export class SupabaseQuoteSessionRepository implements IQuoteSessionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(session: QuoteSession): Promise<Result<string, string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_quote_sessions')
        .upsert({
          id: session.id, // Si es undefined, Supabase genera uno
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
        })
        .select('id')
        .single();

      if (error) return fail(error.message);
      return ok(data.id);

    } catch (error: any) {
      logger.error('Error salvando QuoteSession:', error);
      return fail(error.message || 'Error desconocido');
    }
  }

  async addItems(sessionId: string, items: QuoteItemRequested[]): Promise<Result<void, string>> {
    try {
      const { error } = await this.supabase
        .from('v2_quote_items_requested')
        .insert(items.map(item => ({
          session_id: sessionId,
          catalog_item_id: item.catalogItemId,
          is_custom: item.isCustom,
          custom_name: item.customName
        })));

      if (error) return fail(error.message);
      return ok(undefined);

    } catch (error: any) {
      logger.error('Error agregando ítems a QuoteSession:', error);
      return fail(error.message || 'Error desconocido');
    }
  }

  async findById(id: string): Promise<Result<QuoteSession | null, string>> {
    try {
      const { data, error } = await this.supabase
        .from('v2_quote_sessions')
        .select('*, v2_quote_items_requested(*)')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return ok(null);
        return fail(error.message);
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
        }))
      };

      return ok(session);

    } catch (error: any) {
      logger.error('Error buscando QuoteSession:', error);
      return fail(error.message || 'Error desconocido');
    }
  }

  async listAll(filters?: { status?: string; segment?: string }): Promise<Result<QuoteSession[], string>> {
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

      if (error) return fail(error.message);

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
      return fail(error.message || 'Error desconocido');
    }
  }
}
