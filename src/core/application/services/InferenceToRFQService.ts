import { InferenceEngine } from '@/core/domain/event-intelligence/engine/InferenceEngine';
import { ProductMatcher } from '@/core/domain/event-intelligence/ProductMatcher';
import { IKnowledgeRepository as KnowledgeRepository } from '@app/ports/IKnowledgeRepository';
import { IQuoteSessionRepository as QuoteSessionRepository } from '@app/ports/IQuoteSessionRepository';
import { QuoteSession, QuoteItemRequested, MarketSegment } from '@/core/domain/quote/QuoteTypes';
import { Result, ok, fail } from '@/core/shared/Result';
import { AppError } from '@/core/shared/AppError';
import { Logger } from '@/core/application/ports/Logger';
import { EventProfile, ConfigurationSession, InferredNeed } from '@/core/domain/event-intelligence/types';
import { ResilienceProxy } from '@/core/shared/ResilienceProxy';

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
 * Orquestador encargado de transformas una sesión de configuración (IA)
 * en una solicitud de cotización formal (RFQ) vinculada al catálogo.
 */
export class InferenceToRFQService {
  private resilience = new ResilienceProxy(3, 10000);

  constructor(
    private readonly engine: InferenceEngine,
    private readonly matcher: ProductMatcher,
    private readonly configRepo: KnowledgeRepository,
    private readonly quoteRepo: QuoteSessionRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Ejecuta la conversión completa.
   */
  async convertToRFQ(
    configSessionId: string, 
    clientData: ClientConversionData
  ): Promise<Result<string, AppError>> {
    try {
      this.logger.info('Iniciando conversión a RFQ', { configSessionId, email: clientData.email });

      const configSession = await this.fetchConfigurationSession(configSessionId);
      if (!configSession) return fail(AppError.notFound('Sesión de configuración no encontrada'));

      const inferredNeeds = await this.runInferencePipeline(configSession.baseProfile);
      if (inferredNeeds.isFailure()) return fail(AppError.from(inferredNeeds.getError()));

      const quoteSession = this.createBaseQuoteSession(configSessionId, clientData, configSession, inferredNeeds.getValue().length);
      const saveResult = await this.quoteRepo.save(quoteSession);
      if (saveResult.isFailure()) return saveResult;

      const newQuoteId = saveResult.getValue();

      const requestedItems = await this.mapInferredNeedsToQuoteItems(inferredNeeds.getValue(), newQuoteId);
      const itemsResult = await this.quoteRepo.addItems(newQuoteId, requestedItems);
      if (itemsResult.isFailure()) return fail(AppError.from(itemsResult.getError()));

      this.logger.info('Conversión a RFQ completada con éxito', { quoteSessionId: newQuoteId });
      return ok(newQuoteId);

    } catch (error) {
      this.logger.error('Excepción en InferenceToRFQService:', error);
      return fail(AppError.from(error));
    }
  }

  private async fetchConfigurationSession(id: string): Promise<ConfigurationSession | null> {
    const result = await this.configRepo.getConfigurationSession(id);
    if (result.isFailure()) throw result.getError();
    return result.getValue();
  }

  private async runInferencePipeline(profile: EventProfile): Promise<Result<InferredNeed[], AppError>> {
    // Wrap Error from engine to AppError
    const res = await this.resilience.execute(() => this.engine.runInference(profile));
    if (res.isFailure()) return fail(AppError.from(res.getError()));
    return ok(res.getValue());
  }

  private createBaseQuoteSession(
    configId: string, 
    clientData: ClientConversionData, 
    configSession: ConfigurationSession, 
    needsCount: number
  ): QuoteSession {
    return {
      id: crypto.randomUUID(),
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
