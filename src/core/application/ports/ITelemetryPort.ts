export interface ISpan {
  setAttributes(attributes: Record<string, string | number | boolean>): void;
}

export interface ILoggerPort {
  info(msg: string, ctx?: any): void;
  warn(msg: string, ctx?: any): void;
  error(msg: string, error?: any, ctx?: any): void;
  debug(msg: string, ctx?: any): void;
}

export interface IMetricsPort {
  recordHandlerDuration(name: string, duration: number, success: boolean): void;
  recordHandlerError(name: string, error: string): void;
  recordBusinessError(name: string, error: string): void;
  
  // Custom Business Metrics
  recordOrderCreated(data: Record<string, any>): void;
  recordOrderStateTransition(data: Record<string, any>): void;
  recordQuotationCreated(data: Record<string, any>): void;
  recordQuotationApproved(data: Record<string, any>): void;
  recordQuotationRejected(data: Record<string, any>): void;
  recordStateTransition(newState: string, performer: string): void;
  recordAIBiasAnalysis(score: number): void;
}

export interface ITelemetryProvider {
  withSpan<T>(name: string, attributes: Record<string, string | number | boolean>, fn: (span: ISpan) => Promise<T>): Promise<T>;
  logger: ILoggerPort;
  metrics: IMetricsPort;
}

let provider: ITelemetryProvider | null = null;

export function setTelemetryProvider(p: ITelemetryProvider) {
  provider = p;
}

export function getTelemetryProvider(): ITelemetryProvider {
  if (!provider) {
    // Default fallback to prevent test breakage when not injected
    return {
      withSpan: async (_name, _attrs, fn) => fn({ setAttributes: () => {} }),
      logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
      metrics: { 
        recordHandlerDuration: () => {}, 
        recordHandlerError: () => {}, 
        recordBusinessError: () => {},
        recordOrderCreated: () => {},
        recordOrderStateTransition: () => {},
        recordQuotationCreated: () => {},
        recordQuotationApproved: () => {},
        recordQuotationRejected: () => {},
        recordStateTransition: () => {},
        recordAIBiasAnalysis: () => {}
      }
    };
  }
  return provider;
}
