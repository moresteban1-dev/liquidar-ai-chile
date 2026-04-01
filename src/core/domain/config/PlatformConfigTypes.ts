export interface TaxConfig {
    percentage: number;
    country: string;
    name: string;
}

export interface MarginTiersConfig {
    high_volume: number;
    standard: number;
    low_volume: number;
}
export interface TaxConfig {
    percentage: number;
    country: string;
    name: string;
}

export interface MarginTiersConfig {
    high_volume: number;
    standard: number;
    low_volume: number;
}

export interface PlatformConfigRecord {
    id: string;
    configKey: string;
    category: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configValue: unknown; // Raw JSON payload from DB
    description: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
}
