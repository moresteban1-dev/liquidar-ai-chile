/**
 * Email Templates
 * 
 * HTML email templates for different notification types.
 * All templates use inline styles for maximum email client compatibility.
 */

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1e293b;
  line-height: 1.6;
`;

const buttonStyle = `
  display: inline-block;
  padding: 12px 24px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
`;

const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  padding: 32px;
  background: #ffffff;
`;

const headerStyle = `
  font-size: 24px;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 16px;
`;

function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; background: #f1f5f9; ${baseStyles}">
  <div style="${containerStyle}">
    ${content}
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
      Agencia Digital Chile • Este es un correo automático
    </p>
  </div>
</body>
</html>`;
}

/**
 * Template: Quotation Received
 * Sent to client when they submit a quote request
 */
export function quoteReceivedTemplate(data: {
  clientName: string;
  quoteCode: string;
  brief: string;
}): string {
  return wrap(`
    <h1 style="${headerStyle}">¡Recibimos tu solicitud!</h1>
    <p>Hola ${data.clientName},</p>
    <p>Tu solicitud de cotización ha sido recibida correctamente.</p>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Código:</strong> ${data.quoteCode}</p>
      <p style="margin: 0;"><strong>Descripción:</strong> ${data.brief}</p>
    </div>
    
    <p>Nuestro equipo está evaluando tu proyecto. Te contactaremos en menos de 24 horas con una propuesta.</p>
    
    <p style="margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/quotations" style="${buttonStyle}">
        Ver mis cotizaciones
      </a>
    </p>
  `);
}

/**
 * Template: Quotation Ready
 * Sent to client when their quote has a price
 */
export function quoteReadyTemplate(data: {
  clientName: string;
  quoteCode: string;
  brief: string;
  priceTotal: number;
}): string {
  const formattedPrice = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(data.priceTotal);

  return wrap(`
    <h1 style="${headerStyle}">Tu cotización está lista 🎉</h1>
    <p>Hola ${data.clientName},</p>
    <p>Tenemos el precio de tu proyecto:</p>
    
    <div style="background: #f0fdf4; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #15803d;">Total (IVA incluido)</p>
      <p style="margin: 0; font-size: 36px; font-weight: bold; color: #166534;">${formattedPrice}</p>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Código:</strong> ${data.quoteCode}</p>
      <p style="margin: 0;"><strong>Proyecto:</strong> ${data.brief}</p>
    </div>
    
    <p>Puedes aceptar o rechazar esta cotización desde tu panel.</p>
    
    <p style="margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/quotations" style="${buttonStyle}">
        Ver cotización
      </a>
    </p>
  `);
}

/**
 * Template: Order Delivered
 * Sent to client when their order is ready
 */
export function orderDeliveredTemplate(data: {
  clientName: string;
  orderCode: string;
  brief: string;
}): string {
  return wrap(`
    <h1 style="${headerStyle}">¡Tu proyecto está listo! 🚀</h1>
    <p>Hola ${data.clientName},</p>
    <p>Tu proyecto ha sido completado y está listo para revisión.</p>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Orden:</strong> ${data.orderCode}</p>
      <p style="margin: 0;"><strong>Proyecto:</strong> ${data.brief}</p>
    </div>
    
    <p>Por favor revisa los entregables y aprueba el trabajo o solicita cambios si es necesario.</p>
    
    <p style="margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/orders" style="${buttonStyle}">
        Ver mis pedidos
      </a>
    </p>
  `);
}

/**
 * Template: New Bid Received (Admin)
 * Sent to admin when a provider submits a bid
 */
export function newBidTemplate(data: {
  quoteCode: string;
  providerName: string;
  priceCost: number;
  deliveryDays: number;
}): string {
  const formattedPrice = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(data.priceCost);

  return wrap(`
    <h1 style="${headerStyle}">Nueva oferta recibida</h1>
    <p>Un proveedor ha enviado una oferta para la cotización <strong>${data.quoteCode}</strong>.</p>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Proveedor:</strong> ${data.providerName}</p>
      <p style="margin: 0 0 8px 0;"><strong>Costo:</strong> ${formattedPrice}</p>
      <p style="margin: 0;"><strong>Plazo:</strong> ${data.deliveryDays} días</p>
    </div>
    
    <p style="margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/quotations" style="${buttonStyle}">
        Ver cotización
      </a>
    </p>
  `);
}

/**
 * Template: New Quote Request (Admin)
 * Sent to admin when a new quote is submitted
 */
 
export function newQuoteTemplate(_data: {
  quoteCode: string;
  clientName: string;
  clientEmail: string;
  brief: string;
}): string {
  return wrap(`
    <h1 style="${headerStyle}">Nueva solicitud de cotización</h1>
    <p>Se ha recibido una nueva solicitud de cotización.</p>
    
    <p style="margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/quotations" style="${buttonStyle}">
        Ver cotización
      </a>
    </p>
  `);
}

/**
 * Template: Provider Assigned
 * Sent to provider when they are assigned to quote a project
 */
export function providerAssignedTemplate(data: {
  providerName: string;
  quoteCode: string;
  brief: string;
  location: string;
  date: string;
}): string {
  return wrap(`
    <h1 style="${headerStyle}">Nueva Asignación de Proyecto</h1>
    <p>Hola ${data.providerName},</p>
    <p>Se te ha asignado un nuevo proyecto para cotizar.</p>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Código:</strong> ${data.quoteCode}</p>
      <p style="margin: 0 0 8px 0;"><strong>Fecha del Evento:</strong> ${data.date}</p>
      <p style="margin: 0 0 8px 0;"><strong>Ubicación:</strong> ${data.location}</p>
      <p style="margin: 0;"><strong>Descripción:</strong> ${data.brief}</p>
    </div>
    
    <p>Por favor ingresa a la plataforma para enviar tu cotización desglosada (servicios y logística).</p>
    
    <p style="margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor/quotations" style="${buttonStyle}">
        Cotizar Proyecto
      </a>
    </p>
  `);
}
