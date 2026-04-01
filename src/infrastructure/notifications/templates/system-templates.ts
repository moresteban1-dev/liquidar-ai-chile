// src/infrastructure/notifications/templates/system-templates.ts

import { EmailTemplate } from '../email/TemplateEngine';

export const OPTIMIZATION_ALERT: EmailTemplate = {
  id: 'OPTIMIZATION_ALERT',
  subject: '🔧 Alerta del Sistema — Score: {{score}}/100',
  body: `<div style="padding:20px;background:#0a0a0a;color:#fff;border-radius:12px;">
    <h1 style="color:#ef4444;">Alerta de Optimización</h1>
    <p>El score actual del sistema es: <strong>{{score}}</strong>.</p>
  </div>`,
};

export const SYSTEM_TEMPLATES = [OPTIMIZATION_ALERT];
