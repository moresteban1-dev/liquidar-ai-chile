import { StructuredLogger } from '@/infrastructure/telemetry/StructuredLogger'
import { withSpan } from '@/infrastructure/telemetry/Tracer'
import { ResilienceFactory } from '../resilience/ResilienceFactory'
import { Result, ok, fail } from '@core/shared/Result'
import { AppError } from '@core/shared/AppError'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export class EmailService {
  private readonly resendApiKey: string
  private readonly defaultFrom: string
  private readonly resilience: ResilienceFactory

  constructor(
    resendApiKey: string,
    defaultFrom: string,
    private readonly logger: StructuredLogger
  ) {
    this.resendApiKey = resendApiKey
    this.defaultFrom = defaultFrom
    this.logger = logger.child({ component: 'EmailService' })
    this.resilience = new ResilienceFactory(this.logger)
  }

  /**
   * Sends an email using Resend
   */
  async send(options: EmailOptions): Promise<Result<boolean, AppError>> {
    return withSpan<Result<boolean, AppError>>('EmailService.send', {}, async () => {
      const result = await this.resilience.execute(async () => {
        this.logger.info(`Sending email to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`)

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: options.from || this.defaultFrom,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            reply_to: options.replyTo
          })
        })

        if (!response.ok) {
          const error = await response.json()
          return fail(AppError.internal(`Resend error: ${JSON.stringify(error)}`))
        }

        const data = (await response.json()) as { id: string };
        this.logger.info('Email sent successfully', { emailId: data.id })
        return ok(true)
      }, { name: 'resend_email', retries: 2 });
      
      return result ?? ok(false);
    });
  }
}
