import { container, DI_KEYS } from './Container';
import { NegotiateProviderBidUseCase } from '@core/application/use-cases/NegotiateProviderBidUseCase';
import { AnalyzeQualityReportUseCase } from '@core/application/use-cases/AnalyzeQualityReportUseCase';

/**
 * UseCaseFactory
 * 
 * Provides static factories to resolve use cases with their dependencies from the global container.
 * This pattern ensures that workers and external entry points can easily obtain fully-wired use cases.
 */

export const createNegotiateProviderBidUseCase = () => {
  const quotationRepo = container.resolveSync<any>(DI_KEYS.QuotationRepository);
  const negotiatorAgent = container.resolveSync<any>(DI_KEYS.NegotiatorAgent);
  const logger = container.resolveSync<any>(DI_KEYS.Logger);

  if (!quotationRepo || !negotiatorAgent || !logger) {
    throw new Error('[UseCaseFactory] Missing core dependencies for NegotiateProviderBidUseCase');
  }

  // noteWriter is quotationRepo in this architecture
  return new NegotiateProviderBidUseCase(
    quotationRepo,
    negotiatorAgent,
    quotationRepo,
    logger
  );
};

export const createAnalyzeQualityReportUseCase = () => {
    const orderRepo = container.resolveSync<any>(DI_KEYS.OrderRepository);
    const qaSentinel = container.resolveSync<any>(DI_KEYS.QASentinelAgent);
    const logger = container.resolveSync<any>(DI_KEYS.Logger);
  
    if (!orderRepo || !qaSentinel || !logger) {
      throw new Error('[UseCaseFactory] Missing core dependencies for AnalyzeQualityReportUseCase');
    }
  
    // orderReader and noteWriter are both orderRepo
    return new AnalyzeQualityReportUseCase(
      orderRepo,
      qaSentinel,
      orderRepo,
      logger
    );
};
