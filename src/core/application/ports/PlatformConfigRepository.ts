 
import { PlatformConfigRecord as _PlatformConfigRecord, TaxConfig, MarginTiersConfig } from '../../domain/config/PlatformConfigTypes';

export interface PlatformConfigRepository {
    /**
     * Retrieves a generic configuration value by its key.
     */
    getConfig<T>(key: string): Promise<T | null>;

    /**
     * Specific helper to retrieve the global tax configuration (e.g. IVA 19%).
     */
    getTaxConfig(): Promise<TaxConfig | null>;

    /**
     * Specific helper to retrieve margin configuration tiers.
     */
    getMarginTiers(): Promise<MarginTiersConfig | null>;

    /**
     * Specific helper to retrieve the dynamic down payment percentage required to confirm events.
     */
    getDownPaymentPercentage(): Promise<number>;
}
