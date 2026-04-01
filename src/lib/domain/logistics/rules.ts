/**
 * DOMAIN LAYER - LOGISTICS RULES
 * Pure business logic for checking availability.
 */

import { Booking, EquipmentStock, TimeSlot, AvailabilityResult } from './types';

/**
 * Checks if two time slots overlap.
 * Uses the standard formula: (StartA < EndB) && (EndA > StartB)
 */
export function areSlotsOverlapping(a: TimeSlot, b: TimeSlot): boolean {
    return a.start.getTime() < b.end.getTime() && a.end.getTime() > b.start.getTime();
}

/**
 * Calculates availability for a specific item in a requested slot.
 */
export function checkAvailability(
    equipment: EquipmentStock,
    existingBookings: Booking[],
    requestedSlot: TimeSlot,
    requestedQuantity: number = 1
): AvailabilityResult {
    // 1. Filter bookings that overlap with the requested slot
    const conflictingBookings = existingBookings.filter(booking =>
        areSlotsOverlapping(booking.timeSlot, requestedSlot)
    );

    // 2. Sum up the quantity already reserved in the conflict zone
    // Conservative approach: If multiple events overlap each other, 
    // we take the worst-case scenario (peak usage) within the window?
    // Simplified MVP: Sum of all overlapping might be too aggressive if they don't overlap each other.
    // Better MVP: Iterating through time points is complex. 
    // STANDARD EVENT LOGISTICS APPROXIMATION:
    // If bookings A and B both overlap with Request, do A and B overlap with each other?
    // For safety in this phase, we act as if the item is blocked for the whole duration.
    // We sum all overlapping bookings. (This assumes worst case stack).

    // However, to be precise, we should find the generic "Max Concurrent Usage" during the requested interval.
    // For now, let's keep it simple: Sum of all overlapping bookings. 
    // This is safe (prevents overbooking) but might be pessimistic.

    const reservedQuantity = conflictingBookings.reduce((sum, b) => sum + b.quantity, 0);

    const availableQuantity = equipment.totalQuantity - reservedQuantity;

    return {
        isAvailable: availableQuantity >= requestedQuantity,
        availableQuantity,
        conflictBookings: conflictingBookings.map(b => b.id)
    };
}
