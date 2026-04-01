// src/infrastructure/notifications/templates/quotation-templates.ts

import { EmailTemplate } from '../email/TemplateEngine';

export const QUOTATION_SENT_CLIENT: EmailTemplate = {
  id: 'QUOTATION_SENT_CLIENT',
  subject: '📄 Tu cotización está lista — Pedido #{{orderShortId}}',
  body: `<div style="padding:20px;background:#0a0a0a;color:#fff;border-radius:12px;">
    <h1 style="color:#10b981;">Cotización Lista</h1>
    <p>Hola <strong>{{clientName}}</strong>,</p>
    <p>Ya puedes revisar la cotización para tu pedido <strong>#{{orderShortId}}</strong>.</p>
    <h2 style="color:#10b981;">Total: {{clientPrice}}</h2>
  </div>`,
};

export const QUOTATION_TEMPLATES = [QUOTATION_SENT_CLIENT];
