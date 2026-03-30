import { TemplateEngine } from '@/infrastructure/notifications/email/TemplateEngine';
import { ORDER_TEMPLATES } from '@/infrastructure/notifications/templates/order-templates';
import { QUOTATION_TEMPLATES } from '@/infrastructure/notifications/templates/quotation-templates';
import { SYSTEM_TEMPLATES } from '@/infrastructure/notifications/templates/system-templates';

describe('Template Rendering — Visual QA', () => {
  let engine: TemplateEngine;

  beforeAll(() => {
    engine = new TemplateEngine();
    engine.registerAll(ORDER_TEMPLATES);
    engine.registerAll(QUOTATION_TEMPLATES);
    engine.registerAll(SYSTEM_TEMPLATES);
  });

  it('should register all 3 templates', () => {
    expect(engine.count).toBe(3);
  });

  const TEMPLATE_TEST_CASES = [
    {
      id: 'ORDER_CREATED_CLIENT',
      vars: {
        clientName: 'María García',
        orderShortId: '550e8400',
        orderTitle: 'Boda de Ensueño',
        eventType: 'Boda',
        eventDate: '15 de septiembre de 2026',
        budget: '$200,000 MXN',
        guestCount: 300,
        dashboardUrl: 'https://app.dropservice.com/dashboard/orders/550e8400',
      },
      checks: {
        subject: ['550e8400', 'creado'],
        html: ['María García', 'Boda', '550e8400'],
        notInHtml: ['undefined', 'null', '{{'],
      },
    },
    {
        id: 'QUOTATION_SENT_CLIENT',
        vars: {
          clientName: 'Ana Martínez',
          orderShortId: '1a2b3c4d',
          clientPrice: '$85,000 MXN',
          validUntil: '30 de abril de 2026',
          approveUrl: 'https://app.dropservice.com/dashboard/quotations/q1/approve',
          reviewUrl: 'https://app.dropservice.com/dashboard/quotations/q1',
        },
        checks: {
          subject: ['1a2b3c4d', 'cotización'],
          html: ['Ana Martínez', '85,000', '1a2b3c4d'],
          notInHtml: ['undefined', 'providerCost'],
        },
      },
  ];

  for (const testCase of TEMPLATE_TEST_CASES) {
    describe(`Template: ${testCase.id}`, () => {
      it('should render without errors', () => {
        const result = engine.resolve(testCase.id, testCase.vars);
        expect(result.subject).toBeDefined();
        expect(result.html).toBeDefined();
        expect(result.text).toBeDefined();
      });

      it('should include required content in subject', () => {
        const result = engine.resolve(testCase.id, testCase.vars);
        for (const expected of testCase.checks.subject) {
          expect(result.subject.toLowerCase()).toContain(expected.toLowerCase());
        }
      });

      it('should include required content in HTML', () => {
        const result = engine.resolve(testCase.id, testCase.vars);
        for (const expected of testCase.checks.html) {
          expect(result.html).toContain(expected);
        }
      });
    });
  }
});
