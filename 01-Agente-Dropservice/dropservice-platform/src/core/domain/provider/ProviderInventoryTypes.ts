export type EquipmentCondition = 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR';
export type InventoryStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface ProviderInventoryItem {
    id: string;
    providerId: string;
    itemId: string;
    costPerUnit: number;
    availableQuantity: number | null;
    isAvailable: boolean;
    minRentalDays: number;
    advanceBookingDays: number;
    equipmentCondition?: EquipmentCondition;
    equipmentYear?: number;
    notes?: string;
    status: InventoryStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProviderMatch {
    providerId: string;
    companyName: string;
    rating: number;
    city?: string;
    costPerUnit: number;
    availableQuantity: number | null;
    equipmentCondition?: EquipmentCondition;
    equipmentYear?: number;
    notes?: string;
}

export interface InventoryStats {
    totalItems: number;
    availableItems: number;
    totalValue: number;
    averageCost: number;
    outdatedItems?: number;
}
