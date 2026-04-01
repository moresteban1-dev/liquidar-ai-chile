/**
 * DOMAIN LAYER - LOGISTICS
 * Pure TypeScript definitions. No infrastructure dependencies.
 */

export interface TimeSlot {
    start: Date;
    end: Date;
}

export interface Booking {
    id: string;
    quantity: number;
    timeSlot: TimeSlot;
}

export interface EquipmentStock {
    id: string;
    totalQuantity: number;
}

export interface AvailabilityResult {
    isAvailable: boolean;
    availableQuantity: number;
    conflictBookings: string[]; // IDs of conflicting bookings
}
