import { DataLoader } from './DataLoader';
import { SupabaseClient } from '@supabase/supabase-js';
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger';
import { MetricsCollector } from '@/infrastructure/telemetry/MetricsCollector';

/**
 * Factory that creates request-scoped DataLoaders for common entities.
 */

export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
}

export interface QuotationRow {
  id: string;
  order_id: string;
  provider_id: string;
  provider_cost: number;
  admin_margin: number;
  client_price: number;
  currency: string;
  items: unknown;
  notes: string | null;
  status: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderRow {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  expertise: string[];
  rating: number | null;
  completed_orders: number;
}

export interface RequestLoaders {
  readonly userById: DataLoader<string, UserRow>;
  readonly quotationsByOrderId: DataLoader<string, QuotationRow[]>;
  readonly providerById: DataLoader<string, ProviderRow>;
  readonly quotationCountByOrderId: DataLoader<string, number>;
  readonly latestQuotationByOrderId: DataLoader<string, QuotationRow>;
}

export class DataLoaderFactory {
  static createLoaders(
    supabase: SupabaseClient,
    logger: StructuredLogger,
    metrics: MetricsCollector,
  ): RequestLoaders {
    const log = logger.child({ component: 'DataLoaderFactory' });

    const userById = new DataLoader<string, UserRow>(async (ids) => {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url')
        .in('id', ids);

      metrics.recordHistogram(
        'dataloader.batch.duration_ms',
        Date.now() - startTime,
        { loader: 'userById', batchSize: String(ids.length) },
      );

      if (error) {
        log.error('DataLoader userById batch failed', { error: error.message });
        return new Map<string, UserRow>();
      }

      const resultMap = new Map<string, UserRow>();
      (data || []).forEach((u: any) => resultMap.set(u.id, u as UserRow));
      return resultMap;
    });

    const quotationsByOrderId = new DataLoader<string, QuotationRow[]>(
      async (orderIds) => {
        const startTime = Date.now();
        const { data, error } = await supabase
          .from('quotations')
          .select('*')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false });

        metrics.recordHistogram(
          'dataloader.batch.duration_ms',
          Date.now() - startTime,
          { loader: 'quotationsByOrderId', batchSize: String(orderIds.length) },
        );

        if (error) {
          log.error('DataLoader quotationsByOrderId batch failed', {
            error: error.message,
          });
          return new Map<string, QuotationRow[]>();
        }

        const grouped = new Map<string, QuotationRow[]>();
        orderIds.forEach(id => grouped.set(id, []));
        (data || []).forEach((row: any) => {
          const existing = grouped.get(row.order_id) || [];
          existing.push(row as QuotationRow);
          grouped.set(row.order_id, existing);
        });

        return grouped;
      },
    );

    const providerById = new DataLoader<string, ProviderRow>(async (ids) => {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, email, full_name, company_name, expertise, rating, completed_orders',
        )
        .in('id', ids)
        .eq('role', 'provider');

      metrics.recordHistogram(
        'dataloader.batch.duration_ms',
        Date.now() - startTime,
        { loader: 'providerById', batchSize: String(ids.length) },
      );

      if (error) {
        log.error('DataLoader providerById batch failed', {
          error: error.message,
        });
        return new Map<string, ProviderRow>();
      }

      const resultMap = new Map<string, ProviderRow>();
      (data || []).forEach((p: any) => resultMap.set(p.id, p as ProviderRow));
      return resultMap;
    });

    const quotationCountByOrderId = new DataLoader<string, number>(
      async (orderIds) => {
        const startTime = Date.now();
        const { data, error } = await supabase
          .from('quotations')
          .select('order_id')
          .in('order_id', orderIds);

        metrics.recordHistogram(
          'dataloader.batch.duration_ms',
          Date.now() - startTime,
          {
            loader: 'quotationCountByOrderId',
            batchSize: String(orderIds.length),
          },
        );

        if (error) {
          log.error('DataLoader quotationCountByOrderId batch failed', {
            error: error.message,
          });
          return new Map<string, number>();
        }

        const counts = new Map<string, number>();
        orderIds.forEach(id => counts.set(id, 0));
        (data || []).forEach((row: any) => {
          counts.set(row.order_id, (counts.get(row.order_id) || 0) + 1);
        });

        return counts;
      },
    );

    const latestQuotationByOrderId = new DataLoader<string, QuotationRow>(
      async (orderIds) => {
        const startTime = Date.now();
        const { data, error } = await supabase
          .from('quotations')
          .select('*')
          .in('order_id', orderIds)
          .order('created_at', { ascending: false });

        metrics.recordHistogram(
          'dataloader.batch.duration_ms',
          Date.now() - startTime,
          {
            loader: 'latestQuotationByOrderId',
            batchSize: String(orderIds.length),
          },
        );

        if (error) {
          log.error('DataLoader latestQuotationByOrderId batch failed', {
            error: error.message,
          });
          return new Map<string, QuotationRow>();
        }

        const latest = new Map<string, QuotationRow>();
        (data || []).forEach((row: any) => {
          if (!latest.has(row.order_id)) {
            latest.set(row.order_id, row as QuotationRow);
          }
        });

        return latest;
      },
    );

    return {
      userById,
      quotationsByOrderId,
      providerById,
      quotationCountByOrderId,
      latestQuotationByOrderId,
    };
  }
}
