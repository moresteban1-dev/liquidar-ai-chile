import { InferenceEngine } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { ProductMatcher } from '@/core/domain/event-intelligence/ProductMatcher';
import { IKnowledgeRepository as KnowledgeRepository } from '@app/ports/IKnowledgeRepository';
import { IQuoteSessionRepository as QuoteSessionRepository } from '@app/ports/IQuoteSessionRepository';
import { QuoteSession, QuoteItemRequested, MarketSegment } from '@/core/domain/quote/QuoteTypes';
import { Result, ok, fail } from '@/core/shared/Result';
import { logger } from '@/infrastructure/telemetry/StructuredLogger';
import { EventProfile, ConfigurationSession, InferredNeed } from '@/core/domain/event-intelligence/types';
import { ResilienceProxy } from '@/core/shared/ResilienceProxy';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';

export interface ClientConversionData {
  name: string; 
  email: string; 
  phone: string; 
  company?: string;
  segment?: MarketSegment;
}

/**
 * InferenceToRFQService
 * 
 * Orquestador encargado de transformar una sesión de configuración (IA)
 * en una solicitud de cotización formal (RFQ) vinculada al catálogo.
 */
export class InferenceToRFQService {
  private resilience = new ResilienceProxy(3, 10000);

  constructor(
    private readonly engine: InferenceEngine,
    private readonly matcher: ProductMatcher,
    private readonly configRepo: KnowledgeRepository,
    private readonly quoteRepo: QuoteSessionRepository
  ) {}

  /**
   * Ejecuta la conversión completa.
   */
  async convertToRFQ(
    configSessionId: string, 
    clientData: ClientConversionData
  ): Promise<Result<string, string>> {
    try {
      logger.info('Iniciando conversión a RFQ', { configSessionId, email: clientData.email });

      const configSession = await this.fetchConfigurationSession(configSessionId);
      if (!configSession) return fail('Sesión de configuración no encontrada');

      const inferredNeeds = await this.runInferencePipeline(configSession.baseProfile);
      if (inferredNeeds.isFailure()) return fail(inferredNeeds.getError().message);

      const quoteSession = this.createBaseQuoteSession(configSessionId, clientData, configSession, inferredNeeds.getValue().length);
      const saveResult = await this.quoteRepo.save(quoteSession);
      if (saveResult.isFailure()) return saveResult;

      const newQuoteId = saveResult.getValue();

      const requestedItems = await this.mapInferredNeedsToQuoteItems(inferredNeeds.getValue(), newQuoteId);
      const itemsResult = await this.quoteRepo.addItems(newQuoteId, requestedItems);
      if (itemsResult.isFailure()) return fail(itemsResult.getError());

      logger.info('Conversión a RFQ completada con éxito', { quoteSessionId: newQuoteId });
      return ok(newQuoteId);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Excepción en InferenceToRFQService:', err);
      return fail(err.message);
    }
  }

  private async fetchConfigurationSession(id: string): Promise<ConfigurationSession | null> {
    const result = await this.configRepo.getConfigurationSession(id);
    if (result.isFailure()) throw result.getError();
    return result.getValue();
  }

  private async runInferencePipeline(profile: EventProfile): Promise<Result<InferredNeed[], Error>> {
    return await this.resilience.execute(() => this.engine.runInference(profile));
  }

  private createBaseQuoteSession(
    configId: string, 
    clientData: ClientConversionData, 
    configSession: ConfigurationSession, 
    needsCount: number
  ): QuoteSession {
    return {
      id: uuidv4(),
      segment: clientData.segment || 'CORPORATIVO',
      stepData: { 
        original_config_id: configId,
        ia_inferred_count: needsCount
      },
      eventType: configSession.baseProfile.eventTypeId,
      eventDate: null,
      location: 'Por definir (Consultar IA VenueSpec)',
      attendees: configSession.baseProfile.attendees,
      duration: `${configSession.baseProfile.durationHours}H`,
      budget: 0,
      priorities: [],
      isSustainable: false,
      needsPermits: 'NO',
      clientData: {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.company || '',
        preferences: []
      },
      status: 'DRAFT'
    };
  }

  private async mapInferredNeedsToQuoteItems(needs: InferredNeed[], quoteId: string): Promise<QuoteItemRequested[]> {
    const requestedItems: QuoteItemRequested[] = [];

    for (const need of needs) {
      const matches = await this.resilience.execute(async () => ok(await this.matcher.findBestMatches(need)));
      const bestMatches = matches.isSuccess() ? matches.getValue() as any[] : [];
      
      if (bestMatches.length > 0) {
        requestedItems.push({
          sessionId: quoteId,
          catalogItemId: bestMatches[0]!.id,
          isCustom: false
        });
      } else {
        requestedItems.push({
          sessionId: quoteId,
          isCustom: true,
          customName: `${need.nodeName} (${need.quantityInferred} unidades sugeridas por IA)`
        });
      }
    }
    return requestedItems;
  }
}
