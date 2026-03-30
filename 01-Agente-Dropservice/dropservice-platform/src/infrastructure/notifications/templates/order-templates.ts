// src/infrastructure/notifications/templates/order-templates.ts

import { EmailTemplate } from '../email/TemplateEngine';

export const ORDER_CREATED_CLIENT: EmailTemplate = {
  id: 'ORDER_CREATED_CLIENT',
  subject: '🎉 Pedido #{{orderShortId}} creado exitosamente',
  body: `<div style="padding:20px;background:#0a0a0a;color:#fff;border-radius:12px;">
    <h1 style="color:#6366f1;">Nuevo Pedido Creado</h1>
    <p>Hola <strong>{{clientName}}</strong>,</p>
    <p>Tu pedido <strong>#{{orderShortId}}</strong> ha sido recibido correctamente.</p>
    <div style="background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;">
      <p>Tipo: {{eventType}}</p>
      <p>Fecha: {{eventDate}}</p>
    </div>
  </div>`,
};

export const ORDER_TEMPLATES = [ORDER_CREATED_CLIENT];
