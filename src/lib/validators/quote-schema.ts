import { z } from 'zod';
import { RutValidator } from './RutValidator';

const phoneRegex = /^(?:\+?56)?(?:\s?)(?:9)(?:\s?)[98765432]\d{7}$/;

// ─────────────────────────────────────────────────────────
// Step-specific sub-schemas for per-step wizard validation
// ─────────────────────────────────────────────────────────

/** Step 1: Client identity fields */
export const quoteStep1Schema = z.object({
    clientName: z.string().min(2, { message: "El nombre es muy corto" }),
    clientRut: z.string().refine((val) => RutValidator.validate(val), { message: "RUT inválido (ej: 12345678-9)" }),
    clientEmail: z.string().email({ message: "Email inválido" }),
    clientPhone: z.string().min(8, { message: "Teléfono inválido" }),
});

/** Step 2: Service & requirement fields */
export const quoteStep2Schema = z.object({
    serviceId: z.string().optional(),
    items: z.array(z.object({
        serviceId: z.string(),
        quantity: z.number().min(1)
    })).optional(),
    eventDate: z.coerce.date().refine((date) => !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: "La fecha del evento no puede ser en el pasado",
    }),
    comments: z.string().optional(),
    needsTechnicalVisit: z.boolean(),
});

/** Step 3: Logistics fields */
export const quoteStep3Schema = z.object({
    venueAddress: z.string().min(5, { message: "La dirección es requerida" }),
    mountingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato HH:MM" }),
    eventStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato HH:MM" }),
    eventEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato HH:MM" }),
    dismountingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato HH:MM" }),
});

// ─────────────────────────────────────────────────────────
// Full schema for final form submission (with refinements)
// ─────────────────────────────────────────────────────────

export const quoteSchema = z.object({
    // Step 1: Client Identity
    clientName: z.string().min(2, { message: "El nombre es muy corto" }),
    clientRut: z.string().refine((val) => RutValidator.validate(val), { message: "RUT inválido (ej: 12345678-9)" }),

    clientEmail: z.string().email({ message: "Email inválido" }),
    clientPhone: z.string().min(8, { message: "Teléfono inválido" }),

    // Step 2: Service & Requirement
    serviceId: z.string().optional(), // Made optional to support multi-item cart
    items: z.array(z.object({
        serviceId: z.string(),
        quantity: z.number().min(1)
    })).optional(),

    eventDate: z.coerce.date().refine((date) => !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: "La fecha del evento no puede ser en el pasado",
    }),
    comments: z.string().optional(),
    needsTechnicalVisit: z.boolean(), // Upsell

    // Step 3: Logistics
    venueAddress: z.string().min(5, { message: "La dirección es requerida" }),
    mountingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato HH:MM" }),
    eventStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato HH:MM" }),
    eventEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato HH:MM" }),
    dismountingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato HH:MM" }),
}).refine((data) => {
    if (!data.mountingTime || !data.eventStartTime) return true;
    // Logic: Mounting Time BEFORE Event Start
    return data.mountingTime < data.eventStartTime;
}, {
    message: "El montaje debe ser antes del inicio del evento",
    path: ["mountingTime"],
}).refine((data) => {
    if (!data.eventEndTime || !data.dismountingTime || !data.eventStartTime) return true;
    // Logic: Dismounting Time AFTER Event End
    if (data.eventEndTime < data.eventStartTime) return true; // Overnight event edge case ignored for simple MVP
    return data.dismountingTime > data.eventEndTime;
}, {
    message: "El desmontaje debe ser después del término",
    path: ["dismountingTime"],
}).refine((data) => {
    // Ensure either serviceId OR items are present
    const hasService = data.serviceId && data.serviceId.length > 0;
    const hasItems = data.items && data.items.length > 0;
    return !!(hasService || hasItems);
}, {
    message: "Debes seleccionar un servicio o tener items en el carrito",
    path: ["serviceId"], // Mark serviceId as error target
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;
