import { NotificationRouter } from '@/infrastructure/notifications/NotificationRouter';
import { EmailChannel } from '@/infrastructure/notifications/channels/EmailChannel';
import { WebhookChannel } from '@/infrastructure/notifications/channels/WebhookChannel';
import { TemplateEngine } from '@/infrastructure/notifications/email/TemplateEngine';
import { WebhookDispatcher } from '@/infrastructure/notifications/webhook/WebhookDispatcher';
import { ORDER_TEMPLATES } from '@/infrastructure/notifications/templates/order-templates';
import { QUOTATION_TEMPLATES } from '@/infrastructure/notifications/templates/quotation-templates';
import { DomainEvent } from '@/core/shared/DomainEvent';
import { TEST_IDS, TEST_USERS } from '../../setup/test-factories';

describe('Notification Pipeline — End-to-End Integration', () => {
  let router: NotificationRouter;
  let mockEmailSend: ReturnType<typeof vi.fn>;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock email provider
    mockEmailSend = vi.fn().mockResolvedValue({
      id: crypto.randomUUID(),
      status: 'sent',
      provider: 'test',
      sentAt: new Date(),
      durationMs: 45,
    });

    const mockEmailProvider = {
      providerName: 'test',
      send: mockEmailSend,
    };

    // Mock Supabase with user data
    const userLookup: Record<string, any> = {
      [TEST_IDS.client]: {
        id: TEST_IDS.client,
        email: TEST_USERS.client.email,
        full_name: TEST_USERS.client.name,
        role: 'client',
      },
      [TEST_IDS.provider]: {
        id: TEST_IDS.provider,
        email: TEST_USERS.provider.email,
        full_name: TEST_USERS.provider.name,
        role: 'provider',
      },
      [TEST_IDS.admin]: {
        id: TEST_IDS.admin,
        email: TEST_USERS.admin.email,
        full_name: TEST_USERS.admin.name,
        role: 'admin',
      },
    };

    mockSupabase = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn((field: string, value: string) => {
              if (table === 'profiles') {
                  const user = userLookup[value];
                  return {
                      single: vi.fn().mockResolvedValue({
                        data: user ?? null,
                        error: user ? null : { message: 'Not found' },
                      }),
                  };
              }
              return {
                  contains: vi.fn().mockResolvedValue({ data: [], error: null }),
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
              };
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      })),
    };

    const mockLogger = {
      child: vi.fn().mockReturnThis(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const mockMetrics = {
      recordCounter: vi.fn(),
      recordHistogram: vi.fn(),
      recordGauge: vi.fn(),
      recordEmailSent: vi.fn(),
      recordEmailFailed: vi.fn(),
      recordWebhookSent: vi.fn(),
      recordWebhookFailed: vi.fn(),
    };

    // Setup template engine
    const templateEngine = new TemplateEngine();
    templateEngine.registerAll(ORDER_TEMPLATES);
    templateEngine.registerAll(QUOTATION_TEMPLATES);

    // Setup email channel
    const emailChannel = new EmailChannel({
      provider: mockEmailProvider as any,
      templateEngine,
      logger: mockLogger as any,
      metrics: mockMetrics as any,
    });

    // Setup webhook channel
    const webhookDispatcher = new WebhookDispatcher({
        logger: mockLogger as any,
        metrics: mockMetrics as any
    });

    const webhookChannel = new WebhookChannel({
        dispatcher: webhookDispatcher,
        supabase: mockSupabase,
        logger: mockLogger as any
    });

    // Setup router
    router = new NotificationRouter({ logger: mockLogger as any });

    router.registerChannel(emailChannel);
    router.registerChannel(webhookChannel);
  });

  describe('Order Notifications', () => {
    it('should send email to client when routed with correct payload', async () => {
      const notification = {
        channel: 'email' as const,
        eventType: 'ORDER_CREATED_CLIENT',
        recipients: [{ id: TEST_IDS.client, email: TEST_USERS.client.email, name: TEST_USERS.client.name }],
        payload: {
          clientName: TEST_USERS.client.name,
          orderShortId: '550e8400',
          orderTitle: 'Wedding Event',
        }
      };

      const result = await router.notify(notification);

      expect(result.status).toBe('sent');
      expect(result.successCount).toBe(1);
      expect(mockEmailSend).toHaveBeenCalled();
    });
  });
});
