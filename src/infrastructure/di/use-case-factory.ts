import { container, DI_KEYS } from './Container';
import { NegotiateProviderBidUseCase } from '@core/application/use-cases/NegotiateProviderBidUseCase';
import { AnalyzeQualityReportUseCase } from '@core/application/use-cases/AnalyzeQualityReportUseCase';
import { Result, ok, fail } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

/**
 * UseCaseFactory
 * 
 * Provides static factories to resolve use cases with their dependencies from the global container.
 * This pattern ensures that workers and external entry points can easily obtain fully-wired use cases.
 */

export const createNegotiateProviderBidUseCase = (): Result<NegotiateProviderBidUseCase, AppError> => {
  const quotationRepo = container.resolveSync<any>(DI_KEYS.QuotationRepository);
  const negotiatorAgent = container.resolveSync<any>(DI_KEYS.NegotiatorAgent);
  const logger = container.resolveSync<any>(DI_KEYS.Logger);

  if (!quotationRepo || !negotiatorAgent || !logger) {
    return fail(AppError.internal('[UseCaseFactory] Missing core dependencies for NegotiateProviderBidUseCase'));
  }

  return ok(new NegotiateProviderBidUseCase(
    quotationRepo,
    negotiatorAgent,
    quotationRepo,
    logger
  ));
};

export const createAnalyzeQualityReportUseCase = (): Result<AnalyzeQualityReportUseCase, AppError> => {
    const orderRepo = container.resolveSync<any>(DI_KEYS.OrderRepository);
    const qaSentinel = container.resolveSync<any>(DI_KEYS.QASentinelAgent);
    const logger = container.resolveSync<any>(DI_KEYS.Logger);
  
    if (!orderRepo || !qaSentinel || !logger) {
      return fail(AppError.internal('[UseCaseFactory] Missing core dependencies for AnalyzeQualityReportUseCase'));
    }
  
    return ok(new AnalyzeQualityReportUseCase(
      orderRepo,
      qaSentinel,
      orderRepo,
      logger
    ));
};
