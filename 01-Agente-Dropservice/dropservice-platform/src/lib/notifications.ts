/**
 * Notification Service
 * 
 * High-level functions to send notifications at key events.
 * Combines email utility with templates.
 */

import { sendEmail } from './email';
import {
    quoteReceivedTemplate,
    quoteReadyTemplate,
    orderDeliveredTemplate,
    newBidTemplate,
    newQuoteTemplate,
    providerAssignedTemplate,
} from './email-templates';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@agencia.cl';

/**
 * Send notification when a quote is submitted
 */
export async function notifyQuoteReceived(data: {
    clientEmail: string;
    clientName: string;
    quoteCode: string;
    brief: string;
}): Promise<void> {
    // Notify client
    await sendEmail({
        to: data.clientEmail,
        subject: `Cotización ${data.quoteCode} - Recibida`,
        html: quoteReceivedTemplate({
            clientName: data.clientName,
            quoteCode: data.quoteCode,
            brief: data.brief,
        }),
    });

    // Notify admin
    await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Nueva cotización: ${data.quoteCode}`,
        html: newQuoteTemplate({
            quoteCode: data.quoteCode,
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            brief: data.brief,
        }),
    });
}

/**
 * Send notification when quote has a price ready
 */
export async function notifyQuoteReady(data: {
    clientEmail: string;
    clientName: string;
    quoteCode: string;
    brief: string;
    priceTotal: number;
}): Promise<void> {
    await sendEmail({
        to: data.clientEmail,
        subject: `Cotización ${data.quoteCode} - ¡Tu precio está listo!`,
        html: quoteReadyTemplate({
            clientName: data.clientName,
            quoteCode: data.quoteCode,
            brief: data.brief,
            priceTotal: data.priceTotal,
        }),
    });
}

/**
 * Send notification when order is delivered
 */
export async function notifyOrderDelivered(data: {
    clientEmail: string;
    clientName: string;
    orderCode: string;
    brief: string;
}): Promise<void> {
    await sendEmail({
        to: data.clientEmail,
        subject: `Pedido ${data.orderCode} - ¡Listo para revisar!`,
        html: orderDeliveredTemplate({
            clientName: data.clientName,
            orderCode: data.orderCode,
            brief: data.brief,
        }),
    });
}

/**
 * Send notification when a provider submits a bid
 */
export async function notifyNewBid(data: {
    quoteCode: string;
    providerName: string;
    priceCost: number;
    deliveryDays: number;
}): Promise<void> {
    await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Nueva oferta para ${data.quoteCode}`,
        html: newBidTemplate({
            quoteCode: data.quoteCode,
            providerName: data.providerName,
            priceCost: data.priceCost,
            deliveryDays: data.deliveryDays,
        }),
    });
}

/**
 * Send notification when a provider is assigned a quotation
 */
export async function notifyProviderAssigned(data: {
    providerEmail: string;
    providerName: string;
    quoteCode: string;
    brief: string;
    location: string;
    date: string;
}): Promise<void> {
    await sendEmail({
        to: data.providerEmail,
        subject: `Nuevo proyecto asignado para cotizar: ${data.quoteCode}`,
        html: providerAssignedTemplate({
            providerName: data.providerName,
            quoteCode: data.quoteCode,
            brief: data.brief,
            location: data.location,
            date: data.date,
        }),
    });
}
