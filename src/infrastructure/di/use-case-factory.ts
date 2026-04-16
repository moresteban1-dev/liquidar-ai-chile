import { getContainer } from './Container';
import { DI_KEYS } from './DIKeys';
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

export const createNegotiateProviderBidUseCase = async (): Promise<Result<NegotiateProviderBidUseCase, AppError>> => {
  const c = await getContainer();
  const quotationRepo = await c.resolve<any>(DI_KEYS.QuotationRepository);
  const negotiatorAgent = await c.resolve<any>(DI_KEYS.NegotiatorAgent);
  const logger = await c.resolve<any>(DI_KEYS.Logger);

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

export const createAnalyzeQualityReportUseCase = async (): Promise<Result<AnalyzeQualityReportUseCase, AppError>> => {
  const c = await getContainer();
  const orderRepo = await c.resolve<any>(DI_KEYS.OrderRepository);
  const qaSentinel = await c.resolve<any>(DI_KEYS.QASentinelAgent);
  const logger = await c.resolve<any>(DI_KEYS.Logger);

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
