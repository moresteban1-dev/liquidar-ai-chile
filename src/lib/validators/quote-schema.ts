import { z } from 'zod';

// Helper for Modular 11 RUT Verification
function validateRut(rut: string): boolean {
    if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) return false;
    const [body, dv] = rut.split('-');
    if (!body || !dv) return false;
    let suma = 0;
    let multiplo = 2;
    for (let i = 1; i <= body.length; i++) {
        const index = multiplo * parseInt(body.charAt(body.length - i));
        suma = suma + index;
        if (multiplo < 7) {
            multiplo = multiplo + 1;
        } else {
            multiplo = 2;
        }
    }
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = (dvEsperado === 11) ? "0" : (dvEsperado === 10) ? "K" : dvEsperado.toString();
    return dvCalculado.toUpperCase() === dv.toUpperCase();
}

const phoneRegex = /^(?:\+?56)?(?:\s?)(?:9)(?:\s?)[98765432]\d{7}$/;

export const quoteSchema = z.object({
    // Step 1: Client Identity
    clientName: z.string().min(2, { message: "El nombre es muy corto" }),
    clientRut: z.string().refine(validateRut, { message: "RUT inválido (ej: 12345678-9)" }),
    clientEmail: z.string().email({ message: "Email inválido" }),
    clientPhone: z.string().regex(phoneRegex, { message: "Formato inválido api chilena (ej: +56 9 1234 5678)" }),

    // Step 2: Service & Requirement
    serviceId: z.string().optional(), // Made optional to support multi-item cart
    items: z.array(z.object({
        serviceId: z.string(),
        quantity: z.number().min(1)
    })).optional(),

    eventDate: z.date().refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
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
