export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailSendOptions {
  to: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  id: string;
  status: 'sent' | 'failed' | 'queued';
  provider: string;
  sentAt?: Date;
  error?: string;
  durationMs?: number;
}

export interface IEmailProvider {
  readonly providerName: string;
  send(options: EmailSendOptions): Promise<EmailResult>;
}
