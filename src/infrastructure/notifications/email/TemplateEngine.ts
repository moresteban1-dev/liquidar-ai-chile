// src/infrastructure/notifications/email/TemplateEngine.ts

import { getBaseLayout } from '../templates/base-layout';
import { Result, ok, fail } from '@/core/domain/types/result';
import { AppError } from '@/core/shared/AppError';

export interface EmailTemplate {
  readonly id: string;
  readonly subject: string;
  readonly body: string;
  readonly textBody?: string;
}

export interface ResolvedEmail {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

interface TemplateVariables {
  readonly [key: string]: string | number | boolean | undefined;
}

export class TemplateEngine {
  private readonly templates: Map<string, EmailTemplate> = new Map();
  private readonly baseLayout: string;

  constructor() {
    this.baseLayout = getBaseLayout();
  }

  register(template: EmailTemplate): void {
    this.templates.set(template.id, template);
  }

  registerAll(templates: EmailTemplate[]): void {
    for (const t of templates) {
      this.register(t);
    }
  }

  resolve(templateId: string, variables: TemplateVariables): Result<ResolvedEmail, AppError> {
    const template = this.templates.get(templateId);
    if (!template) {
      return fail(AppError.notFound(`Template`, templateId));
    }

    const safeVars = this.sanitizeVariables(variables);
    const subject = this.replaceVariables(template.subject, safeVars);
    const bodyFragment = this.replaceVariables(template.body, safeVars);

    const layoutVars: TemplateVariables = {
      ...safeVars,
      CONTENT: bodyFragment,
      SUBJECT: subject,
      YEAR: new Date().getFullYear(),
    };
    const html = this.replaceVariables(this.baseLayout, layoutVars);

    const text = template.textBody
      ? this.replaceVariables(template.textBody, safeVars)
      : this.htmlToPlainText(bodyFragment, safeVars);

    return ok({ subject, html, text });
  }

  has(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  get count(): number {
    return this.templates.size;
  }

  private replaceVariables(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      const value = variables[key];
      if (value === undefined) return match;
      return String(value);
    });
  }

  private sanitizeVariables(variables: TemplateVariables): TemplateVariables {
    const sanitized: Record<string, string | number | boolean | undefined> = {};
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string') {
        sanitized[key] = this.escapeHtml(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private escapeHtml(str: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, (char) => map[char] ?? char);
  }

  private htmlToPlainText(html: string, _variables: TemplateVariables): string {
    let text = html;
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#039;/g, "'");
    text = text.trim();
    return text;
  }
}
