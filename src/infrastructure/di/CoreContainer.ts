import { createServiceRoleClient } from '@/lib/supabase/api';
import { SupabaseProviderInventoryRepository } from '@infrastructure/persistence/supabase/repositories/SupabaseProviderInventoryRepository';
import { SupabaseQuotationRepository } from '@infrastructure/persistence/supabase/repositories/SupabaseQuotationRepository';
import { SupabaseQuotationHistoryRepository } from '@infrastructure/persistence/supabase/repositories/SupabaseQuotationHistoryRepository';
import { SupabaseAIAuditAdapter } from '@infrastructure/persistence/supabase/SupabaseAIAuditAdapter';
import { VercelAIGenerator } from '@infrastructure/ai/VercelAIGenerator';
import { LoggerAdapter } from '@infrastructure/telemetry/LoggerAdapter';
import { ConfidenceService } from '@core/application/services/ConfidenceService';
import { QuotationService } from '@core/application/services/quotation-service';
import { AIBrokerService } from '@core/application/services/AIBrokerService';

let quotationServiceInstance: QuotationService | null = null;
let aiBrokerServiceInstance: AIBrokerService | null = null;

export const diContainer = {
    getQuotationService: (): QuotationService => {
        if (!quotationServiceInstance) {
            const supabase = createServiceRoleClient();
            quotationServiceInstance = new QuotationService(
                new SupabaseQuotationRepository(supabase),
                new SupabaseQuotationHistoryRepository(supabase),
                new LoggerAdapter()
            );
        }
        return quotationServiceInstance;
    },

    getAIBrokerService: (): AIBrokerService => {
        if (!aiBrokerServiceInstance) {
            const supabase = createServiceRoleClient();
            aiBrokerServiceInstance = new AIBrokerService(
                new LoggerAdapter(),
                new VercelAIGenerator(),
                new SupabaseProviderInventoryRepository(supabase),
                new SupabaseQuotationRepository(supabase),
                diContainer.getQuotationService(),
                new ConfidenceService(),
                new SupabaseAIAuditAdapter()
            );
        }
        return aiBrokerServiceInstance;
    }
};
