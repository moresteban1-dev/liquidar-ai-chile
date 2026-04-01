import { metrics } from '@opentelemetry/api';

export interface MetricsCollector {
  recordCounter(name: string, value: number, attributes?: Record<string, string>): void;
  recordOrderCreated(attributes?: Record<string, string>): void;
  recordQuotationCreated(attributes?: Record<string, string>): void;
  recordQuotationApproved(attributes?: Record<string, string>): void;
  recordQuotationRejected(attributes?: Record<string, string>): void;
  recordRevenue(amount: number, currency: string, attributes?: Record<string, string>): void;
  recordProfit(amount: number, currency: string, attributes?: Record<string, string>): void;
  recordHandlerDuration(handler: string, durationMs: number, success: boolean, attributes?: Record<string, string>): void;
  recordHandlerError(handler: string, errorMessage: string, attributes?: Record<string, string>): void;
  recordDbQuery(operation: string, table: string, durationMs: number, success: boolean, attributes?: Record<string, string>): void;
  recordOrderTransition(orderId: string, fromState: string, newState: string): void;
  recordUserLogin(userId: string, role: string): void;
  recordApiRequest(method: string, path: string, status: number, durationMs: number): void;
  recordBusinessError(handler: string, error: string): void;
  recordStateTransition(newState: string, performer: string): void;
  recordHistogram(name: string, value: number, attributes?: Record<string, string>): void;
  recordGauge(name: string, value: number, attributes?: Record<string, string>): void;
}

export class MetricsCollectorImpl implements MetricsCollector { constructor() { }
  private readonly meter = metrics.getMeter('dropservice-platform');
  private readonly ordersCreated = this.meter.createCounter('business.orders.created');
  private readonly quotationsCreated = this.meter.createCounter('business.quotations.created');
  private readonly quotationsApproved = this.meter.createCounter('business.quotations.approved');
  private readonly quotationsRejected = this.meter.createCounter('business.quotations.rejected');
  private readonly revenue = this.meter.createCounter('business.revenue');
  private readonly profit = this.meter.createCounter('business.profit');
  private readonly handlerDuration = this.meter.createHistogram('technical.handler.duration');
  private readonly handlerErrors = this.meter.createCounter('technical.handler.errors');
  private readonly dbQueryDuration = this.meter.createHistogram('technical.db.duration');
  private readonly apiRequests = this.meter.createCounter('technical.api.requests');
  
  private readonly genericCounters = new Map<string, any>();
  private readonly genericHistograms = new Map<string, any>();

  recordCounter(name: string, value: number, attributes?: Record<string, string>): void {
    let counter = this.genericCounters.get(name);
    if (!counter) {
      counter = this.meter.createCounter(name);
      this.genericCounters.set(name, counter);
    }
    counter.add(value, attributes);
  }

  recordHistogram(name: string, value: number, attributes?: Record<string, string>): void {
    let histogram = this.genericHistograms.get(name);
    if (!histogram) {
      histogram = this.meter.createHistogram(name);
      this.genericHistograms.set(name, histogram);
    }
    histogram.record(value, attributes);
  }

  recordOrderCreated(attributes?: Record<string, string>): void {
    this.ordersCreated.add(1, attributes);
  }

  recordQuotationCreated(attributes?: Record<string, string>): void {
    this.quotationsCreated.add(1, attributes);
  }

  recordQuotationApproved(attributes?: Record<string, string>): void {
    this.quotationsApproved.add(1, attributes);
  }

  recordQuotationRejected(attributes?: Record<string, string>): void {
    this.quotationsRejected.add(1, attributes);
  }

  recordRevenue(amount: number, currency: string, attributes?: Record<string, string>): void {
    this.revenue.add(amount, { ...attributes, currency });
  }

  recordProfit(amount: number, currency: string, attributes?: Record<string, string>): void {
    this.profit.add(amount, { ...attributes, currency });
  }

  recordHandlerDuration(handler: string, durationMs: number, success: boolean, attributes?: Record<string, string>): void {
    this.handlerDuration.record(durationMs, { ...attributes, handler, success: String(success) });
  }

  recordHandlerError(handler: string, errorMessage: string, attributes?: Record<string, string>): void {
    this.handlerErrors.add(1, { ...attributes, handler, error: errorMessage.substring(0, 100) });
  }

  recordDbQuery(operation: string, table: string, durationMs: number, success: boolean, attributes?: Record<string, string>): void {
    this.dbQueryDuration.record(durationMs, { ...attributes, operation, table, success: String(success) });
  }

  recordOrderTransition(_orderId: string, _fromState: string, _newState: string): void {
    this.recordCounter('order.transition', 1, { from: _fromState, to: _newState });
  }

  recordUserLogin(_userId: string, _role: string): void {
    this.recordCounter('user.login', 1, { role: _role });
  }

  recordApiRequest(method: string, path: string, status: number, _durationMs: number): void {
    this.apiRequests.add(1, { method, path, status: String(status) });
  }

  recordBusinessError(handler: string, error: string): void {
    this.recordCounter('business.error', 1, { handler, error });
  }

  recordStateTransition(newState: string, performer: string): void {
    this.recordCounter('order.state_transition', 1, { new_state: newState, performer });
  }

  recordGauge(name: string, value: number, attributes?: Record<string, string>): void {
    // OpenTelemetry Metrics SDK handles Gauges via Observables or UpDownCounters usually.
    // For simplicity in this implementation, we simulate with a counter or log.
    // Ideally use this.meter.createUpDownCounter(name).
    this.recordCounter(`${name}.gauge_proxy`, value, attributes);
  }
}

export const metricsCollector: MetricsCollector = new MetricsCollectorImpl();
