import { NextRequest, NextResponse } from 'next/server'
import { getContainer } from '@/infrastructure/di/Container'
import { OutboxProcessor } from '@/infrastructure/events/OutboxProcessor'
import { NotifyClientOnOrderUpdateHandler } from '@/core/application/handlers/NotifyClientOnOrderUpdateHandler'
import { ok, internalError } from '@/infrastructure/http/helpers/responses'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const container = getContainer()
  const supabase = container.resolve('supabase')
  const logger = container.resolve('logger')
  const emailService = container.resolve('emailService')
  const webhookService = container.resolve('webhookService')

  try {
    const notificationHandler = new NotifyClientOnOrderUpdateHandler(emailService, webhookService)
    const processor = new OutboxProcessor(supabase, notificationHandler, logger)
    
    const processedCount = await processor.processPendingEvents()
    
    return ok({ processedCount })
  } catch (error) {
    logger.error('Outbox processor cron failed', { error })
    return internalError('Outbox processing failed')
  }
}
