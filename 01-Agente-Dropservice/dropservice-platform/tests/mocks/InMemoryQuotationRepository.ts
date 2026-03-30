import { IQuotationRepository } from '@/core/application/ports/repositories/IQuotationRepository';
import { Quotation } from '@/core/domain/aggregates/Quotation';
import { Result } from '@/core/shared/Result';
import { UniqueEntityID } from '@/core/shared/UniqueEntityID';

export class InMemoryQuotationRepository implements IQuotationRepository {
  private quotations: Map<string, Quotation> = new Map();
  public saveCallCount = 0;

  async save(quotation: Quotation): Promise<Result<void, string>> {
    this.quotations.set(quotation.id.toString(), quotation);
    this.saveCallCount++;
    return Result.ok(undefined);
  }

  async findById(id: UniqueEntityID): Promise<Result<Quotation | null, string>> {
    const quotation = this.quotations.get(id.toString());
    return Result.ok(quotation ?? null);
  }

  async findByOrder(orderId: UniqueEntityID): Promise<Result<Quotation[], string>> {
    const items = Array.from(this.quotations.values()).filter(
      (q) => q.orderId.equals(orderId),
    );
    return Result.ok(items);
  }

  async findByProvider(providerId: UniqueEntityID): Promise<Result<Quotation[], string>> {
    const items = Array.from(this.quotations.values()).filter(
      (q) => q.providerId.equals(providerId),
    );
    return Result.ok(items);
  }

  async delete(id: UniqueEntityID): Promise<Result<void, string>> {
    this.quotations.delete(id.toString());
    return Result.ok(undefined);
  }

  async getClientEmail(clientId: string): Promise<Result<string | null, string>> {
      // In a real mock, we'd have a user profiles map
      return Result.ok(null);
  }

  // ── Test Helpers ──

  reset(): void {
    this.quotations.clear();
    this.saveCallCount = 0;
  }

  seed(quotations: Quotation[]): void {
    for (const q of quotations) {
      this.quotations.set(q.id.toString(), q);
    }
  }

  get count(): number {
    return this.quotations.size;
  }
}
