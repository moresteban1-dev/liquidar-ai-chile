import { SupabaseClient } from '@supabase/supabase-js';
import { PlatformConfigRepository } from '@core/application/ports/PlatformConfigRepository';
import { TaxConfig, MarginTiersConfig } from '@core/domain/config/PlatformConfigTypes';
import { PLATFORM_DEFAULTS } from '@core/domain/config/PlatformDefaults';

export class SupabasePlatformConfigRepository implements PlatformConfigRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getConfig<T>(key: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from('platform_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      console.warn(`[PlatformConfig] Failed to fetch "${key}":`, error.message);
      return null;
    }

    return data?.value as T ?? null;
  }

  async getTaxConfig(): Promise<TaxConfig | null> {
    return this.getConfig<TaxConfig>('tax_config');
  }

  async getMarginTiers(): Promise<MarginTiersConfig | null> {
    return this.getConfig<MarginTiersConfig>('margin_tiers');
  }

  async getDownPaymentPercentage(): Promise<number> {
    const val = await this.getConfig<number>('down_payment_percentage');
    return val ?? PLATFORM_DEFAULTS.DOWN_PAYMENT_PERCENTAGE;
  }
}
