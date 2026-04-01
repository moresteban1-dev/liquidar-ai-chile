import { withSpan } from '@/infrastructure/telemetry/Tracer'
import { ResilienceFactory } from '../resilience/ResilienceFactory'
import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger'
import { Result, ok, fail } from '@core/shared/Result'
import { AppError } from '@core/shared/AppError'

export interface WebhookPayload {
  event: string
  timestamp: string
  data: any
  metadata?: Record<string, any>
}

export class WebhookService {
  private readonly resilience: ResilienceFactory

  constructor(
    private readonly n8nWebhookUrl: string,
    private readonly secret: string,
    private readonly logger: StructuredLogger
  ) {
    this.logger = logger.child({ component: 'WebhookService' })
    this.resilience = new ResilienceFactory(this.logger)
  }

  /**
   * Sends a payload to the configured N8N webhook
   */
  async send(payload: WebhookPayload): Promise<Result<boolean, AppError>> {
    return withSpan<Result<boolean, AppError>>('WebhookService.send', {}, async () => {
      const result = await this.resilience.execute(async () => {
        this.logger.info(`Sending webhook event: ${payload.event}`)

        const response = await fetch(this.n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': this.secret,
            'X-Source': 'Dropservice-Platform'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorText = await response.text()
          return fail(AppError.internal(`Webhook status ${response.status}: ${errorText}`))
        }

        this.logger.info('Webhook delivered successfully', { event: payload.event })
        return ok(true)
      }, { name: 'n8n_webhook', retries: 2 });
      
      return result ?? ok(false);
    }).catch(err => fail(AppError.from(err)))
  }
}
