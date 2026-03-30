import * as Events from '@core/domain/aggregates/quotation/QuotationEvents';
import { domainEventBus } from '@infrastructure/events/DomainEventBus';
import { createServiceRoleClient } from '@/lib/supabase/api';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

const supabase = createServiceRoleClient();

export const registerQuotationHandlers = () => {
    
    // Handler for new Quotations
    domainEventBus.subscribe("QuotationRequested", async (event: unknown) => {
        const ev = event as Events.QuotationRequested;
        logger.info(`[Handler] Processing QuotationRequested for ${ev.aggregateId}`);
        await supabase.from('quotation_summaries').upsert({
            id: ev.aggregateId,
            client_id: ev.clientId,
            service_id: ev.serviceId,
            event_date: (ev as any).eventDate, // Type casting while normalizing event props
            status: 'DRAFT',
            code: 'DRAFT',
            updated_at: new Date()
        });
    });

    // Handler for Status Changes
    domainEventBus.subscribe("QuotationStatusChanged", async (event: unknown) => {
        const ev = event as Events.QuotationStatusChanged;
        logger.info(`[Handler] Processing QuotationStatusChanged for ${ev.aggregateId} -> ${ev.newStatus}`);
        await supabase.from('quotation_summaries')
            .update({ status: ev.newStatus, updated_at: new Date() })
            .eq('id', ev.aggregateId);
    });

    // Handler for Price/Margin Updates
    domainEventBus.subscribe("MarginApplied", async (event: unknown) => {
        const ev = event as Events.MarginApplied;
        logger.info(`[Handler] Processing MarginApplied for ${ev.aggregateId}: ${ev.priceTotal}`);
        await supabase.from('quotation_summaries')
            .update({ 
                total_amount: ev.priceTotal, 
                status: 'AWAITING_CLIENT_PAYMENT',
                updated_at: new Date() 
            })
            .eq('id', ev.aggregateId);
    });
};
