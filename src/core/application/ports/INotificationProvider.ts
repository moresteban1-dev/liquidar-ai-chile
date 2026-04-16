import { Result } from '@/core/shared/Result'
import { AppError } from '@/core/shared/AppError'

export interface IEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export interface IEmailProvider {
  send(options: IEmailOptions): Promise<Result<boolean, AppError>>
}

export interface IWebhookOptions {
  event: string
  timestamp: string
  data: any
}

export interface IWebhookProvider {
  send(payload: IWebhookOptions): Promise<boolean>
}
